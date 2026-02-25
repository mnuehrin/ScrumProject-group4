import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createFeedbackSchema } from "@/lib/validations";
import type { FeedbackCategory } from "@/types";
import { cookies } from "next/headers";

const SESSION_COOKIE = "efp_session_id";

function getOrCreateSessionId(req: NextRequest): string {
  const cookieStore = cookies();
  return cookieStore.get(SESSION_COOKIE)?.value ?? req.headers.get("x-session-id") ?? "";
}

// GET /api/feedback?category=CULTURE&sort=newest|top
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") as FeedbackCategory | null;
  const sort = searchParams.get("sort") ?? "newest";
  const sessionId = getOrCreateSessionId(req);

  const where = category ? { category } : {};

  const feedbackList = await prisma.feedback.findMany({
    where,
    orderBy: sort === "top" ? { upvotes: "desc" } : { createdAt: "desc" },
    include: { _count: { select: { comments: true } } },
  });

  let upvotedIds = new Set<string>();
  let downvotedIds = new Set<string>();
  if (sessionId) {
    const votes = await prisma.upvote.findMany({
      where: { sessionId, feedbackId: { in: feedbackList.map((f) => f.id) } },
      select: { feedbackId: true, voteType: true },
    });
    upvotedIds = new Set(votes.filter((v) => v.voteType === "UP").map((v) => v.feedbackId));
    downvotedIds = new Set(votes.filter((v) => v.voteType === "DOWN").map((v) => v.feedbackId));
  }

  const result = feedbackList.map(({ _count, ...feedback }) => ({
    ...feedback,
    hasUpvoted: upvotedIds.has(feedback.id),
    hasDownvoted: downvotedIds.has(feedback.id),
    commentsCount: _count.comments,
  }));

  return NextResponse.json(result);
}

// POST /api/feedback
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = createFeedbackSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { content, category } = parsed.data;
  const sessionId = getOrCreateSessionId(req);

  const feedback = await prisma.feedback.create({
    data: {
      content,
      category,
      submitterSessionId: sessionId || null,
    },
  });

  await prisma.activityLog.create({
    data: {
      feedbackId: feedback.id,
      action: "CREATED",
      details: { category },
    },
  });

  return NextResponse.json(feedback, { status: 201 });
}
