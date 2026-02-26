import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.feedback.findUnique({
    where: { id: params.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Feedback not found" }, { status: 404 });
  }

  // Delete related records first, then the feedback itself
  await prisma.$transaction([
    prisma.feedbackPromptResponse.deleteMany({ where: { feedbackId: params.id } }),
    prisma.feedbackComment.deleteMany({ where: { feedbackId: params.id } }),
    prisma.upvote.deleteMany({ where: { feedbackId: params.id } }),
    prisma.activityLog.deleteMany({ where: { feedbackId: params.id } }),
    prisma.reward.deleteMany({ where: { feedbackId: params.id } }),
    prisma.feedback.delete({ where: { id: params.id } }),
  ]);

  return NextResponse.json({ success: true });
}
