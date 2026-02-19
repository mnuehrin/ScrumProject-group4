import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const now = new Date();
  const sessionId = req.headers.get("x-session-id") ?? "";

  const campaign = await prisma.campaign.findFirst({
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

  if (!campaign) {
    return NextResponse.json({ campaign: null, questions: [] });
  }

  let respondedIds = new Set<string>();
  if (sessionId) {
    const responses = await prisma.questionResponse.findMany({
      where: { sessionId, questionId: { in: campaign.questions.map((q) => q.id) } },
      select: { questionId: true },
    });
    respondedIds = new Set(responses.map((r) => r.questionId));
  }

  const questions = campaign.questions.map((q) => ({
    ...q,
    hasResponded: respondedIds.has(q.id),
  }));

  return NextResponse.json({
    campaign: {
      id: campaign.id,
      title: campaign.title,
      description: campaign.description,
      status: campaign.status,
      startsAt: campaign.startsAt,
      endsAt: campaign.endsAt,
    },
    questions,
  });
}
