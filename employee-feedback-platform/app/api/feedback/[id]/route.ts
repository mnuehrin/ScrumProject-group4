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

  try {
    // If this feedback is linked to a campaign question, disconnect it first
    // so the backfill function doesn't recreate it on next page load
    if (existing.questionId) {
      await prisma.question.delete({
        where: { id: existing.questionId },
      }).catch(() => {
        // If question doesn't exist or can't be deleted, just unlink
        return prisma.feedback.update({
          where: { id: params.id },
          data: { questionId: null },
        });
      });
    }

    // Re-fetch in case cascade already deleted the feedback
    const stillExists = await prisma.feedback.findUnique({
      where: { id: params.id },
    });

    if (!stillExists) {
      return NextResponse.json({ success: true });
    }

    // Null out self-referencing parent IDs on comment replies
    await prisma.feedbackComment.updateMany({
      where: { feedbackId: params.id, parentId: { not: null } },
      data: { parentId: null },
    });

    // Delete all related records, then the feedback itself
    await prisma.$transaction([
      prisma.feedbackPromptResponse.deleteMany({ where: { feedbackId: params.id } }),
      prisma.feedbackComment.deleteMany({ where: { feedbackId: params.id } }),
      prisma.upvote.deleteMany({ where: { feedbackId: params.id } }),
      prisma.activityLog.deleteMany({ where: { feedbackId: params.id } }),
      prisma.reward.deleteMany({ where: { feedbackId: params.id } }),
      prisma.feedback.delete({ where: { id: params.id } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Delete feedback error:", err);
    return NextResponse.json(
      { error: "Failed to delete feedback", detail: err?.message },
      { status: 500 }
    );
  }
}
