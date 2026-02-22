import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * GET /api/admin/trends
 * Returns aggregated stats for the admin feedback dashboard. Admin-only.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalFeedback,
    feedbackLast24h,
    feedbackLast7d,
    byCategory,
    byStatus,
    campaignCounts,
    recentActivityCount,
  ] = await Promise.all([
    prisma.feedback.count(),
    prisma.feedback.count({ where: { createdAt: { gte: oneDayAgo } } }),
    prisma.feedback.count({ where: { createdAt: { gte: oneWeekAgo } } }),
    prisma.feedback.groupBy({
      by: ["category"],
      _count: { id: true },
    }),
    prisma.feedback.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
    prisma.campaign.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
    prisma.activityLog.count({
      where: { createdAt: { gte: oneWeekAgo } },
    }),
  ]);

  const categoryTrends = Object.fromEntries(
    byCategory.map((row) => [row.category, row._count.id])
  );
  const statusTrends = Object.fromEntries(
    byStatus.map((row) => [row.status, row._count.id])
  );
  const campaignsByStatus = Object.fromEntries(
    campaignCounts.map((row) => [row.status, row._count.id])
  );

  return NextResponse.json({
    totalFeedback,
    feedbackLast24h,
    feedbackLast7d,
    byCategory: categoryTrends,
    byStatus: statusTrends,
    campaignsByStatus,
    recentActivityCount,
  });
}
