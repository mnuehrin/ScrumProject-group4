import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { FeedbackTable } from "@/components/admin/FeedbackTable";
import type { FeedbackWithMeta } from "@/types";

/** Backfill: create Feedback records for any campaign questions that don't have one yet. */
async function backfillCampaignQuestions() {
  const orphaned = await prisma.question.findMany({
    where: { feedback: { is: null } },
    include: { campaign: { select: { title: true, category: true, status: true } } },
  });

  if (orphaned.length === 0) return;

  const statusMap = { LIVE: "IN_PROGRESS", ARCHIVED: "RESOLVED", DRAFT: "PENDING" } as const;

  await prisma.$transaction(
    orphaned.map((q) =>
      prisma.feedback.create({
        data: {
          content: q.prompt,
          category: q.campaign.category,
          status: statusMap[q.campaign.status] ?? "PENDING",
          adminNote: `Post: ${q.campaign.title}`,
          upvotes: q.upvotes ?? 0,
          downvotes: q.downvotes ?? 0,
          createdAt: q.createdAt,
          questionId: q.id,
        },
      })
    )
  );
}

async function getAllFeedback(): Promise<FeedbackWithMeta[]> {
  const rows = await prisma.feedback.findMany({
    orderBy: { createdAt: "desc" },
    include: { reward: true, _count: { select: { comments: true } } },
  });
  return rows.map((f) => ({
    ...f,
    downvotes: f.downvotes ?? 0,
    hasUpvoted: false,
    hasDownvoted: false,
    reward: f.reward ?? null,
    commentsCount: f._count.comments,
  }));
}

function isDbConnectionError(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  return /Can't reach database|connection|ECONNREFUSED|ETIMEDOUT/i.test(msg);
}

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  let feedback: FeedbackWithMeta[];
  let questionResponseCount: number;
  try {
    await backfillCampaignQuestions();
    [feedback, questionResponseCount] = await Promise.all([
      getAllFeedback(),
      prisma.questionResponse.count(),
    ]);
  } catch (e) {
    if (isDbConnectionError(e)) {
      return (
        <section className="space-y-7">
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 dark:border-amber-800 dark:bg-amber-950/40">
            <p className="font-semibold text-amber-800 dark:text-amber-200">
              Database unavailable
            </p>
            <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
              Can&apos;t reach the database at <code className="rounded bg-amber-200/50 px-1 dark:bg-amber-800/50">localhost:3306</code>.
              Start MySQL (or your DB server) and ensure <code className="rounded bg-amber-200/50 px-1 dark:bg-amber-800/50">.env</code> has the correct <code className="rounded bg-amber-200/50 px-1 dark:bg-amber-800/50">DATABASE_URL</code>.
            </p>
          </div>
        </section>
      );
    }
    throw e;
  }

  const totalPosts = feedback.length;
  const totalDiscussions = feedback.reduce((sum, item) => sum + item.commentsCount, 0);
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
        <div className="flex items-center gap-4">
          <a
            href="/api/admin/feedback/export"
            download="feedback-export.csv"
            className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground shadow-sm transition hover:bg-accent/50"
          >
            Export CSV
          </a>
          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
      <FeedbackTable feedback={feedback} />
    </section>
  );
}
