import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { FeedbackTable } from "@/components/admin/FeedbackTable";
import type { FeedbackWithMeta, FeedbackStatus } from "@/types";

async function getAllFeedback(): Promise<FeedbackWithMeta[]> {
  const rows = await prisma.feedback.findMany({
    orderBy: { createdAt: "desc" },
    include: { reward: true, _count: { select: { comments: true } } },
  });
  return rows.map((f) => ({
    ...f,
    hasUpvoted: false,
    reward: f.reward ?? null,
    commentsCount: f._count.comments,
  }));
}

type CampaignDashboardRow = {
  id: string;
  title: string;
  category: "CULTURE" | "TOOLS" | "WORKLOAD" | "MANAGEMENT" | "OTHER";
  status: "DRAFT" | "LIVE" | "ARCHIVED";
  questions: Array<{
    id: string;
    prompt: string;
    createdAt: Date;
    responsesCount: number;
  }>;
};

async function getCampaignRows(): Promise<CampaignDashboardRow[]> {
  const rows = await prisma.campaign.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      questions: {
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { responses: true } } },
      },
    },
  });

  return rows.map((campaign) => ({
    id: campaign.id,
    title: campaign.title,
    category: campaign.category,
    status: campaign.status,
    questions: campaign.questions.map((question) => ({
      id: question.id,
      prompt: question.prompt,
      createdAt: question.createdAt,
      responsesCount: question._count.responses,
    })),
  }));
}

function campaignStatusToFeedbackStatus(
  campaignStatus: "DRAFT" | "LIVE" | "ARCHIVED"
): FeedbackStatus {
  if (campaignStatus === "LIVE") return "IN_PROGRESS";
  if (campaignStatus === "ARCHIVED") return "RESOLVED";
  return "PENDING";
}

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  const [feedback, campaigns] = await Promise.all([getAllFeedback(), getCampaignRows()]);
  const campaignPosts: FeedbackWithMeta[] = campaigns.flatMap((campaign) =>
    campaign.questions.map((question) => ({
      id: `campaign-question-${question.id}`,
      content: question.prompt,
      category: campaign.category,
      createdAt: question.createdAt,
      upvotes: question.responsesCount,
      status: campaignStatusToFeedbackStatus(campaign.status),
      adminNote: `Campaign: ${campaign.title}`,
      statusUpdatedAt: null,
      statusUpdatedBy: null,
      submitterSessionId: null,
      hasUpvoted: false,
      reward: null,
      commentsCount: question.responsesCount,
    }))
  );
  const combinedPosts = [...feedback, ...campaignPosts].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const campaignPostCount = campaignPosts.length;
  const feedbackDiscussions = feedback.reduce((sum, item) => sum + item.commentsCount, 0);
  const campaignDiscussions = campaignPosts.reduce(
    (sum, post) => sum + post.commentsCount,
    0
  );
  const totalPosts = feedback.length + campaignPostCount;
  const totalDiscussions = feedbackDiscussions + campaignDiscussions;
  const totalSubmissions = totalPosts + totalDiscussions;

  return (
    <section className="space-y-7">
      <div className="flex items-center justify-between rounded-xl border border-border bg-card px-5 py-4">
        <div>
          <p className="text-sm text-muted-foreground">{totalSubmissions} total submissions</p>
          <p className="text-xs text-muted-foreground">
            {totalPosts} posts · {totalDiscussions} discussions
          </p>
        </div>
        <form action="/api/auth/signout" method="POST">
          <button
            type="submit"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign out
          </button>
        </form>
      </div>
      <FeedbackTable feedback={combinedPosts} />
    </section>
  );
}
