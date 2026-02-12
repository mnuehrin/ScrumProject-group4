import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { FeedbackTable } from "@/components/admin/FeedbackTable";
import type { FeedbackWithMeta } from "@/types";

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

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  const feedback = await getAllFeedback();

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">
          {feedback.length} total submissions
        </p>
        <form action="/api/auth/signout" method="POST">
          <button
            type="submit"
            className="text-xs text-slate-500 hover:text-slate-900 transition-colors"
          >
            Sign out
          </button>
        </form>
      </div>
      <FeedbackTable feedback={feedback} />
    </section>
  );
}
