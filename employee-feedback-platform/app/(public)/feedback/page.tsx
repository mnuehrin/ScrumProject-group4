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

export default async function FeedbackPage() {
  const feedback = await getFeedback();

  return (
    <section className="space-y-6">
      <div className="space-y-2">
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
