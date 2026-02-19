import { prisma } from "@/lib/db";
import { FeedbackFeed } from "@/components/feedback/FeedbackFeed";
import { CampaignFeed } from "@/components/feedback/CampaignFeed";
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

type CampaignResponseView = {
  id: string;
  content: string;
  createdAt: Date;
  authorLabel: string;
};

type CampaignQuestionView = {
  id: string;
  prompt: string;
  responses: CampaignResponseView[];
};

type CampaignFeedView = {
  id: string;
  title: string;
  description: string | null;
  category: "CULTURE" | "TOOLS" | "WORKLOAD" | "MANAGEMENT" | "OTHER";
  questions: CampaignQuestionView[];
};

function toAuthorLabel(sessionId: string) {
  return `Anon-${sessionId.slice(-4).toUpperCase()}`;
}

async function getCampaignFeed(): Promise<CampaignFeedView[]> {
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

  const responses = await prisma.questionResponse.findMany({
    where: { questionId: { in: questionIds } },
    orderBy: { createdAt: "asc" },
  });

  const responsesByQuestion = new Map<string, CampaignResponseView[]>();
  responses.forEach((response) => {
    const entry = responsesByQuestion.get(response.questionId) ?? [];
    entry.push({
      id: response.id,
      content: response.content,
      createdAt: response.createdAt,
      authorLabel: toAuthorLabel(response.sessionId),
    });
    responsesByQuestion.set(response.questionId, entry);
  });

  return campaigns.map((campaign) => ({
    id: campaign.id,
    title: campaign.title,
    description: campaign.description,
    category: campaign.category,
    questions: campaign.questions.map((question) => ({
      id: question.id,
      prompt: question.prompt,
      responses: responsesByQuestion.get(question.id) ?? [],
    })),
  }));
}

export default async function FeedbackPage() {
  const feedback = await getFeedback();
  const campaigns = await getCampaignFeed();

  return (
    <section className="max-w-5xl space-y-7">
      <CampaignFeed campaigns={campaigns} />
      <div className="space-y-2 rounded-xl border border-slate-200 bg-white px-5 py-6 sm:px-6">
        <h1 className="text-2xl font-semibold text-slate-900">Feedback feed</h1>
        <p className="text-sm text-slate-600">
          Browse all feedback submitted by your colleagues. Upvote items that
          resonate with you to help surface the most important issues.
        </p>
      </div>
      <FeedbackFeed initialFeedback={feedback} />
    </section>
  );
}
