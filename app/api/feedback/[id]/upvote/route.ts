import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { upvoteSchema } from "@/lib/validations";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json().catch(() => null);
  const parsed = upvoteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid session ID" }, { status: 400 });
  }

  const { sessionId } = parsed.data;
  const feedbackId = params.id;

  // Check the feedback exists
  const feedback = await prisma.feedback.findUnique({ where: { id: feedbackId } });
  if (!feedback) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const existing = await prisma.upvote.findUnique({
    where: { feedbackId_sessionId: { feedbackId, sessionId } },
  });

  if (existing) {
    // Remove upvote
    await prisma.upvote.delete({ where: { id: existing.id } });
    const updated = await prisma.feedback.update({
      where: { id: feedbackId },
      data: { upvotes: { decrement: 1 } },
    });
    return NextResponse.json({ upvotes: updated.upvotes, hasUpvoted: false });
  }

  // Add upvote
  await prisma.upvote.create({ data: { feedbackId, sessionId } });
  const updated = await prisma.feedback.update({
    where: { id: feedbackId },
    data: { upvotes: { increment: 1 } },
  });

  await prisma.activityLog.create({
    data: {
      feedbackId,
      action: "UPVOTED",
      details: { sessionId },
    },
  });

  return NextResponse.json({ upvotes: updated.upvotes, hasUpvoted: true });
}
