import { prisma } from "@/lib/db";
import { FeedbackFeed } from "@/components/feedback/FeedbackFeed";
import { FeedbackSidePanel } from "@/components/feedback/FeedbackSidePanel";
import type { FeedbackWithMeta } from "@/types";

async function getFeedback(): Promise<FeedbackWithMeta[]> {
  const rows = await prisma.feedback.findMany({
    // ✅ FIX: remove feedbackResponses filter (table doesn't exist in DB)
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { comments: true } } },
  });

  return rows.map((f) => ({
    ...f,
    downvotes: f.downvotes ?? 0,
    hasUpvoted: false,
    hasDownvoted: false,
    commentsCount: f._count.comments,
  }));
}

type CampaignQuestionFeedView = {
  id: string;
  campaignId: string;
  campaignTitle: string;
  campaignDescription: string | null;
  campaignCategory: "CULTURE" | "TOOLS" | "WORKLOAD" | "MANAGEMENT" | "OTHER";
  questionPrompt: string;
  createdAt: Date;
  responsesCount: number;
  upvotes: number;
  downvotes: number;
};

async function getCampaignFeed(): Promise<CampaignQuestionFeedView[]> {
  const now = new Date();

  const campaigns = await prisma.campaign.findMany({
    where: {
      status: "LIVE",
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
      ],
    },
    orderBy: { createdAt: "desc" },
    include: {
      questions: { orderBy: [{ order: "asc" }, { createdAt: "asc" }] },
    },
  });

  if (campaigns.length === 0) return [];

  const questionIds = campaigns.flatMap((campaign) =>
    campaign.questions.map((question) => question.id)
  );

  const responseCounts = await prisma.questionResponse.groupBy({
    by: ["questionId"],
    where: { questionId: { in: questionIds } },
    _count: { _all: true },
  });

  const responseCountMap = new Map<string, number>();
  responseCounts.forEach((row) => {
    responseCountMap.set(row.questionId, row._count._all);
  });

  const items: CampaignQuestionFeedView[] = [];
  campaigns.forEach((campaign) => {
    campaign.questions.forEach((question) => {
      items.push({
        id: question.id,
        campaignId: campaign.id,
        campaignTitle: campaign.title,
        campaignDescription: campaign.description,
        campaignCategory: campaign.category,
        questionPrompt: question.prompt,
        createdAt: question.createdAt,
        responsesCount: responseCountMap.get(question.id) ?? 0,
        upvotes: question.upvotes ?? 0,
        downvotes: question.downvotes ?? 0,
      });
    });
  });

  return items;
}

export default async function FeedbackPage() {
  const feedback = await getFeedback();
  const campaignQuestions = await getCampaignFeed();

  const companyName = process.env.NEXT_PUBLIC_COMPANY_NAME || "Sundevils";
  const companyLogoSrc =
    process.env.NEXT_PUBLIC_COMPANY_LOGO ||
    "/Arizona_State_University_Pitchfork_-_Square_-_EzB.webp";

  const liveCampaigns = new Set(campaignQuestions.map((item) => item.campaignId)).size;

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const weeklyFeedbackCount = feedback.filter(
    (item) => new Date(item.createdAt).getTime() >= oneWeekAgo.getTime()
  ).length;

  const weeklyQuestionCount = campaignQuestions.filter(
    (item) => new Date(item.createdAt).getTime() >= oneWeekAgo.getTime()
  ).length;

  const weeklyActivity = weeklyFeedbackCount + weeklyQuestionCount;

  return (
    <section className="flex h-full min-h-0 w-full flex-col gap-6">
      <div className="shrink-0 space-y-2">
        <h1 className="sr-only">Feedback feed</h1>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Browse all feedback submitted by your colleagues. Upvote items that
          resonate with you to help surface the most important issues.
        </p>
      </div>

      <div className="grid min-h-0 flex-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-h-0 xl:overflow-y-auto xl:pr-1">
          <FeedbackFeed
            initialFeedback={feedback}
            initialCampaignQuestions={campaignQuestions.map((item) => ({
              id: item.id,
              campaignTitle: item.campaignTitle,
              campaignDescription: item.campaignDescription,
              category: item.campaignCategory,
              prompt: item.questionPrompt,
              createdAt: item.createdAt,
              responsesCount: item.responsesCount,
              upvotes: item.upvotes,
              downvotes: item.downvotes,
            }))}
          />
        </div>

        <div className="xl:-mt-16 xl:h-full xl:overflow-hidden">
          <FeedbackSidePanel
            companyName={companyName}
            companyLogoSrc={companyLogoSrc}
            liveCampaigns={liveCampaigns}
            weeklyActivity={weeklyActivity}
          />
        </div>
      </div>
    </section>
  );
}