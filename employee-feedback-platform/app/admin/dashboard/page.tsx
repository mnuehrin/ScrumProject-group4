import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SubmissionsChart } from "./_components/submissions-chart";
import { CategoryChart } from "./_components/category-chart";
import { StatusChart } from "./_components/status-chart";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MessageSquare, CheckCircle2, Flame, Clock } from "lucide-react";

const CATEGORY_LABELS: Record<string, string> = {
  CULTURE: "Culture",
  TOOLS: "Tools",
  WORKLOAD: "Workload",
  MANAGEMENT: "Management",
  OTHER: "Other",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  REVIEWED: "Reviewed",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
};

// Recharts requires raw color values (Hex, RGB, HSL)
const CATEGORY_COLORS: Record<string, string> = {
  CULTURE: "#f97316", // orange-500
  TOOLS: "#3b82f6", // blue-500
  WORKLOAD: "#22c55e", // green-500
  MANAGEMENT: "#a855f7", // purple-500
  OTHER: "#475569", // slate-600
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#64748b", // slate-500
  REVIEWED: "#3b82f6", // blue-500
  IN_PROGRESS: "#eab308", // yellow-500
  RESOLVED: "#22c55e", // green-500
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
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  let totalFeedback: number;
  let totalFeedbackComments: number;
  let totalResolvedFeedback: number;
  let totalPendingFeedback: number;

  let totalUpvotesObj: { _sum: { upvotes: number | null } };

  let byCategory: { category: string; _count: { id: number } }[];
  let byStatus: { status: string; _count: { id: number } }[];

  let feedbackDates: { createdAt: Date }[];

  try {
    const [
      fTotal, fcTotal,
      fResolved, fPending,
      fUpvotesSum,
      fCategoryRows,
      fStatusRows,
      allFeedback,
    ] = await Promise.all([
      prisma.feedback.count(),
      prisma.feedbackComment.count(),
      prisma.feedback.count({ where: { status: "RESOLVED" } }),
      prisma.feedback.count({ where: { status: "PENDING" } }),
      prisma.feedback.aggregate({ _sum: { upvotes: true } }),
      prisma.feedback.groupBy({ by: ["category"], _count: { id: true } }),
      prisma.feedback.groupBy({ by: ["status"], _count: { id: true } }),
      prisma.feedback.findMany({
        where: { createdAt: { gte: oneMonthAgo } },
        select: { createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    totalFeedback = fTotal;
    totalFeedbackComments = fcTotal;
    totalResolvedFeedback = fResolved;
    totalPendingFeedback = fPending;

    totalUpvotesObj = fUpvotesSum;

    byCategory = fCategoryRows;
    byStatus = fStatusRows;
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

  // --- KPI Processing ---
  const totalPosts = totalFeedback;
  const totalDiscussions = totalFeedbackComments;
  const totalSubmissions = totalPosts + totalDiscussions;

  const totalResolved = totalResolvedFeedback;
  const totalPending = totalPendingFeedback;

  const resolutionRate = totalPosts > 0 ? ((totalResolved / totalPosts) * 100).toFixed(1) : "0";
  const totalUpvotes = totalUpvotesObj._sum.upvotes || 0;
  const avgEngagement = totalPosts > 0 ? (totalUpvotes / totalPosts).toFixed(1) : "0";

  const categoryTrends = Object.fromEntries(
    byCategory.map((row) => [row.category, row._count.id])
  );

  const statusTrends = Object.fromEntries(
    byStatus.map((row) => [row.status, row._count.id])
  );

  // Pad the last 30 days so the chart doesn't have skipping dates
  const last30Days = Array.from({ length: 30 }).map((_, i) => {
    const d = new Date(now.getTime() - (29 - i) * 24 * 60 * 60 * 1000);
    return d.toISOString().slice(0, 10);
  });

  const submissionsByDate = feedbackDates.reduce<Record<string, number>>(
    (acc, { createdAt }) => {
      const key = createdAt.toISOString().slice(0, 10);
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    },
    {}
  );

  const submissionsOverTime = last30Days.map((dateStr) => ({
    label: formatChartDate(new Date(dateStr)),
    value: submissionsByDate[dateStr] ?? 0,
  }));

  const categoryOrder = ["CULTURE", "TOOLS", "WORKLOAD", "MANAGEMENT", "OTHER"] as const;
  const categoryChartData = categoryOrder.map(cat => ({
    name: CATEGORY_LABELS[cat],
    value: categoryTrends[cat] ?? 0,
    fill: CATEGORY_COLORS[cat] ?? "#475569"
  })).filter(d => d.value > 0);

  const statusOrder = ["PENDING", "REVIEWED", "IN_PROGRESS", "RESOLVED"] as const;
  const statusChartData = statusOrder.map(status => ({
    name: STATUS_LABELS[status],
    value: statusTrends[status] ?? 0,
    fill: STATUS_COLORS[status] ?? "#475569"
  }));

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Analytics Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Monitor feedback trends, engagement, and resolution rates.
          </p>
        </div>
        <Link
          href="/admin"
          className="inline-flex items-center justify-center rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm transition hover:bg-accent hover:text-accent-foreground"
        >
          View feedback table
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Total Feedback</h3>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSubmissions}</div>
            <p className="text-xs text-muted-foreground">{totalPosts} posts · {totalDiscussions} discussions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Resolution Rate</h3>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resolutionRate}%</div>
            <p className="text-xs text-muted-foreground">{totalResolved} resolved out of {totalPosts} posts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Pending Action</h3>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPending}</div>
            <p className="text-xs text-muted-foreground">Posts awaiting initial review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Avg. Engagement</h3>
            <Flame className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgEngagement}</div>
            <p className="text-xs text-muted-foreground">Upvotes per post</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* SUBMISSIONS OVER TIME (Spans more columns) */}
        <Card className="col-span-full lg:col-span-4">
          <CardHeader>
            <h3 className="font-semibold leading-none tracking-tight">Submissions Over Time (30 Days)</h3>
          </CardHeader>
          <CardContent className="pl-2">
            <SubmissionsChart data={submissionsOverTime} />
          </CardContent>
        </Card>

        {/* CATEGORY DISTRIBUTION */}
        <Card className="col-span-full lg:col-span-3">
          <CardHeader>
            <h3 className="font-semibold leading-none tracking-tight">Feedback by Category</h3>
          </CardHeader>
          <CardContent>
            <CategoryChart data={categoryChartData} />
          </CardContent>
        </Card>
      </div>

      {/* BOTTOM ROW */}
      <div className="grid gap-6">
        {/* STATUS OVERVIEW */}
        <Card>
          <CardHeader>
            <h3 className="font-semibold leading-none tracking-tight">Current Status Overview</h3>
          </CardHeader>
          <CardContent className="pl-2">
            <StatusChart data={statusChartData} />
          </CardContent>
        </Card>
      </div>

    </section>
  );
}
