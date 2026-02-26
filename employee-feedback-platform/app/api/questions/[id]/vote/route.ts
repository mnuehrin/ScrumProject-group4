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
  const questionId = params.id;

  try {
    const question = await prisma.question.findUnique({
      where: { id: questionId },
    });
    if (!question) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const existing = await prisma.questionVote.findUnique({
      where: { questionId_sessionId: { questionId, sessionId } },
    });

    let upDelta = 0;
    let downDelta = 0;
    let resultHasUpvoted = false;
    let resultHasDownvoted = false;

    if (existing) {
      const existingType = existing.voteType ?? "UP";

      if (existingType === voteType) {
        // Same button again → remove vote
        await prisma.questionVote.delete({ where: { id: existing.id } });
        upDelta = existingType === "UP" ? -1 : 0;
        downDelta = existingType === "DOWN" ? -1 : 0;
      } else {
        // Switching direction
        await prisma.questionVote.update({
          where: { id: existing.id },
          data: { voteType },
        });
        upDelta = voteType === "UP" ? 1 : -1;
        downDelta = voteType === "DOWN" ? 1 : -1;
        resultHasUpvoted = voteType === "UP";
        resultHasDownvoted = voteType === "DOWN";
      }
    } else {
      // New vote
      await prisma.questionVote.create({
        data: { questionId, sessionId, voteType },
      });
      upDelta = voteType === "UP" ? 1 : 0;
      downDelta = voteType === "DOWN" ? 1 : 0;
      resultHasUpvoted = voteType === "UP";
      resultHasDownvoted = voteType === "DOWN";
    }

    const currentUpvotes = question.upvotes ?? 0;
    const currentDownvotes = question.downvotes ?? 0;

    const updated = await prisma.question.update({
      where: { id: questionId },
      data: {
        upvotes: Math.max(0, currentUpvotes + upDelta),
        downvotes: Math.max(0, currentDownvotes + downDelta),
      },
    });

    return NextResponse.json({
      upvotes: updated.upvotes,
      downvotes: updated.downvotes,
      hasUpvoted: resultHasUpvoted,
      hasDownvoted: resultHasDownvoted,
    });
  } catch (err) {
    console.error("[question vote route error]", err);
    return NextResponse.json(
      { error: "Failed to process vote" },
      { status: 500 }
    );
  }
}
