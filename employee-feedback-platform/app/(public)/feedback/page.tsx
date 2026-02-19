import { prisma } from "@/lib/db";
import { FeedbackFeed } from "@/components/feedback/FeedbackFeed";
import type { FeedbackWithMeta } from "@/types";

async function getFeedback(): Promise<FeedbackWithMeta[]> {
  const rows = await prisma.feedback.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { comments: true } } },
  });
  return rows.map((f) => ({
    ...f,
    hasUpvoted: false,
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
      });
    });
  });

  return items;
}

export default async function FeedbackPage() {
  const feedback = await getFeedback();
  const campaignQuestions = await getCampaignFeed();

  return (
    <section className="max-w-5xl space-y-7">
      <div className="space-y-2 rounded-xl border border-slate-200 bg-white px-5 py-6 sm:px-6">
        <h1 className="text-2xl font-semibold text-slate-900">Feedback feed</h1>
        <p className="text-sm text-slate-600">
          Browse all feedback submitted by your colleagues. Upvote items that
          resonate with you to help surface the most important issues.
        </p>
      </div>
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
        }))}
      />
    </section>
  );
}
