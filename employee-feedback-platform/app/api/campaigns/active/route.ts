import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const now = new Date();
  const sessionId = req.headers.get("x-session-id") ?? "";

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

  if (campaigns.length === 0) {
    return NextResponse.json({ campaigns: [] });
  }

  let respondedIds = new Set<string>();
  if (sessionId) {
    const responses = await prisma.questionResponse.findMany({
      where: {
        sessionId,
        questionId: { in: campaigns.flatMap((c) => c.questions.map((q) => q.id)) },
      },
      select: { questionId: true },
    });
    respondedIds = new Set(responses.map((r) => r.questionId));
  }

  const result = campaigns.map((campaign) => ({
    id: campaign.id,
    title: campaign.title,
    description: campaign.description,
    category: campaign.category,
    status: campaign.status,
    startsAt: campaign.startsAt,
    endsAt: campaign.endsAt,
    questions: campaign.questions.map((q) => ({
      ...q,
      hasResponded: respondedIds.has(q.id),
    })),
  }));

  return NextResponse.json({ campaigns: result });
}
