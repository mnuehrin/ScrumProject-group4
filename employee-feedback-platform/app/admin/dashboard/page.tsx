import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

const CATEGORY_LABELS: Record<string, string> = {
  CULTURE: "Culture",
  TOOLS: "Tools",
  WORKLOAD: "Workload",
  MANAGEMENT: "Management",
  OTHER: "Other",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "PENDING",
  REVIEWED: "REVIEWED",
  IN_PROGRESS: "IN PROGRESS",
  RESOLVED: "RESOLVED",
};

const CATEGORY_BAR_COLORS: Record<string, string> = {
  CULTURE: "bg-orange-500",
  TOOLS: "bg-blue-500",
  WORKLOAD: "bg-green-500",
  MANAGEMENT: "bg-purple-500",
  OTHER: "bg-slate-600",
};

function isDbConnectionError(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  return /Can't reach database|connection|ECONNREFUSED|ETIMEDOUT/i.test(msg);
}

function formatChartDate(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  let totalFeedback: number;
  let byCategory: { category: string; _count: { id: number } }[];
  let byStatus: { status: string; _count: { id: number } }[];
  let feedbackDates: { createdAt: Date }[];

  try {
    const [total, categoryRows, statusRows, allFeedback] = await Promise.all([
      prisma.feedback.count(),
      prisma.feedback.groupBy({
        by: ["category"],
        _count: { id: true },
      }),
      prisma.feedback.groupBy({
        by: ["status"],
        _count: { id: true },
      }),
      prisma.feedback.findMany({
        where: { createdAt: { gte: oneWeekAgo } },
        select: { createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
    ]);
    totalFeedback = total;
    byCategory = categoryRows;
    byStatus = statusRows;
    feedbackDates = allFeedback;
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (isDbConnectionError(e)) {
      return (
        <section className="space-y-7">
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 dark:border-amber-800 dark:bg-amber-950/40">
            <p className="font-semibold text-amber-800 dark:text-amber-200">
              Database unavailable
            </p>
            <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
              Can&apos;t reach the database. Start MySQL and ensure <code className="rounded bg-amber-200/50 px-1 dark:bg-amber-800/50">.env</code> has the correct <code className="rounded bg-amber-200/50 px-1 dark:bg-amber-800/50">DATABASE_URL</code>.
            </p>
          </div>
        </section>
      );
    }
    console.error("[Admin Dashboard]", e);
    return (
      <section className="space-y-7">
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 dark:border-red-800 dark:bg-red-950/40">
          <p className="font-semibold text-red-800 dark:text-red-200">
            Something went wrong
          </p>
          <p className="mt-1 text-sm text-red-700 dark:text-red-300">
            {message}
          </p>
          <p className="mt-2 text-xs text-red-600 dark:text-red-400">
            Check the terminal for details. Run <code className="rounded bg-red-200/50 px-1">npx prisma generate --schema=backend/prisma/schema.prisma</code> if the schema changed.
          </p>
        </div>
      </section>
    );
  }

  const categoryTrends = Object.fromEntries(
    byCategory.map((row) => [row.category, row._count.id])
  );
  const statusTrends = Object.fromEntries(
    byStatus.map((row) => [row.status, row._count.id])
  );

  const submissionsByDate = feedbackDates.reduce<Record<string, number>>(
    (acc, { createdAt }) => {
      const key = createdAt.toISOString().slice(0, 10);
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    },
    {}
  );
  const dateLabels = Object.keys(submissionsByDate).sort();
  const submissionsOverTime = dateLabels.map((d) => ({
    label: formatChartDate(new Date(d)),
    value: submissionsByDate[d] ?? 0,
  }));
  const maxOverTime = Math.max(1, ...submissionsOverTime.map((x) => x.value));
  const maxCategory = Math.max(1, ...Object.values(categoryTrends));
  const maxStatus = Math.max(1, ...Object.values(statusTrends));

  const categoryOrder = ["CULTURE", "TOOLS", "WORKLOAD", "MANAGEMENT", "OTHER"] as const;
  const statusOrder = ["PENDING", "REVIEWED", "IN_PROGRESS", "RESOLVED"] as const;

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            Feedback trends
          </h1>
          <p className="text-sm text-muted-foreground">
            Updates every 30s · {totalFeedback} total submissions
          </p>
        </div>
        <Link
          href="/admin"
          className="inline-flex items-center justify-center rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm transition hover:bg-accent/50"
        >
          View feedback table
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* SUBMISSIONS OVER TIME */}
        <div className="rounded-xl border border-border bg-card px-5 py-4 shadow-sm">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-foreground">
            Submissions over time
          </h2>
          <div className="space-y-3">
            {submissionsOverTime.length === 0 ? (
              <p className="text-sm text-muted-foreground">No submissions yet.</p>
            ) : (
              submissionsOverTime.map(({ label, value }) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="w-12 shrink-0 text-sm text-foreground">{label}</span>
                  <div className="min-w-0 flex-1">
                    <div className="h-6 w-full overflow-hidden rounded bg-muted/60">
                      <div
                        className="h-full rounded bg-slate-600"
                        style={{ width: `${(value / maxOverTime) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="w-6 shrink-0 text-right text-sm tabular-nums text-foreground">
                    {value}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* BY CATEGORY */}
        <div className="rounded-xl border border-border bg-card px-5 py-4 shadow-sm">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-foreground">
            By category
          </h2>
          <div className="space-y-3">
            {categoryOrder.map((cat) => {
              const value = categoryTrends[cat] ?? 0;
              return (
                <div key={cat} className="flex items-center gap-3">
                  <span className="w-24 shrink-0 text-sm text-foreground">{cat}</span>
                  <div className="min-w-0 flex-1">
                    <div className="h-6 w-full overflow-hidden rounded bg-muted/60">
                      <div
                        className={`h-full rounded ${CATEGORY_BAR_COLORS[cat] ?? "bg-slate-600"}`}
                        style={{ width: `${(value / maxCategory) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="w-6 shrink-0 text-right text-sm tabular-nums text-foreground">
                    {value}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* BY STATUS */}
        <div className="rounded-xl border border-border bg-card px-5 py-4 shadow-sm lg:col-span-2">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-foreground">
            By status
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {statusOrder.map((status) => {
              const value = statusTrends[status] ?? 0;
              return (
                <div key={status} className="flex items-center gap-3">
                  <span className="w-24 shrink-0 text-sm text-foreground">
                    {STATUS_LABELS[status]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="h-6 w-full overflow-hidden rounded bg-muted/60">
                      <div
                        className="h-full rounded bg-slate-600"
                        style={{ width: `${(value / maxStatus) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="w-6 shrink-0 text-right text-sm tabular-nums text-foreground">
                    {value}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
