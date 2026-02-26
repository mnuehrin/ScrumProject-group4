import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { voteSchema } from "@/lib/validations";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json().catch(() => null);
  const parsed = voteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { sessionId, voteType } = parsed.data;
  const feedbackId = params.id;

  try {
    const feedback = await prisma.feedback.findUnique({
      where: { id: feedbackId },
    });
    if (!feedback) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const existing = await prisma.upvote.findUnique({
      where: { feedbackId_sessionId: { feedbackId, sessionId } },
    });

    // Determine what to do and compute counter deltas
    let upDelta = 0;
    let downDelta = 0;
    let resultHasUpvoted = false;
    let resultHasDownvoted = false;

    if (existing) {
      const existingType = existing.voteType ?? "UP"; // handle legacy rows without voteType

      if (existingType === voteType) {
        // Same button again → remove vote entirely
        await prisma.upvote.delete({ where: { id: existing.id } });
        upDelta = existingType === "UP" ? -1 : 0;
        downDelta = existingType === "DOWN" ? -1 : 0;
        resultHasUpvoted = false;
        resultHasDownvoted = false;
      } else {
        // Switching direction
        await prisma.upvote.update({
          where: { id: existing.id },
          data: { voteType },
        });
        upDelta = voteType === "UP" ? 1 : -1;
        downDelta = voteType === "DOWN" ? 1 : -1;
        resultHasUpvoted = voteType === "UP";
        resultHasDownvoted = voteType === "DOWN";
      }
    } else {
      // Brand new vote
      await prisma.upvote.create({ data: { feedbackId, sessionId, voteType } });
      upDelta = voteType === "UP" ? 1 : 0;
      downDelta = voteType === "DOWN" ? 1 : 0;
      resultHasUpvoted = voteType === "UP";
      resultHasDownvoted = voteType === "DOWN";

      if (voteType === "UP") {
        await prisma.activityLog.create({
          data: { feedbackId, action: "UPVOTED", details: { sessionId } },
        });
      }
    }

    // Apply counter deltas — clamp to 0 to prevent negative counts
    const currentUpvotes = feedback.upvotes ?? 0;
    const currentDownvotes = (feedback as Record<string, unknown>).downvotes as number ?? 0;

    const updated = await prisma.feedback.update({
      where: { id: feedbackId },
      data: {
        upvotes: Math.max(0, currentUpvotes + upDelta),
        ...(downDelta !== 0
          ? { downvotes: Math.max(0, currentDownvotes + downDelta) }
          : {}),
      },
    });

    return NextResponse.json({
      upvotes: updated.upvotes,
      downvotes: (updated as Record<string, unknown>).downvotes ?? 0,
      hasUpvoted: resultHasUpvoted,
      hasDownvoted: resultHasDownvoted,
    });
  } catch (err) {
    console.error("[vote route error]", err);
    return NextResponse.json(
      { error: "Failed to process vote" },
      { status: 500 }
    );
  }
}
