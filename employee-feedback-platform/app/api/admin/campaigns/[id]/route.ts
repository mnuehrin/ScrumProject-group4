import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { updateCampaignSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = updateCampaignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { title, description, startsAt, endsAt, status, category } = parsed.data;

  const statusMap = { LIVE: "IN_PROGRESS", ARCHIVED: "RESOLVED", DRAFT: "PENDING" } as const;

  const campaign = await prisma.campaign.update({
    where: { id: params.id },
    data: {
      title: title?.trim(),
      description: description?.trim() ?? undefined,
      startsAt: startsAt === null ? null : startsAt ? new Date(startsAt) : undefined,
      endsAt: endsAt === null ? null : endsAt ? new Date(endsAt) : undefined,
      category,
      status,
    },
    include: { questions: { select: { id: true } } },
  });

  // Cascade status/category changes to all linked Feedback records:
  // 1. Question-prompt shadow records   (linked via questionId)
  // 2. Employee Q&A response records    (linked via adminNote prefix)
  if (status || category) {
    const questionIds = campaign.questions.map((q) => q.id);
    const feedbackStatus = status ? (statusMap[status] ?? "PENDING") : undefined;
    const updateData: Record<string, unknown> = {};
    if (feedbackStatus) updateData.status = feedbackStatus;
    if (category) updateData.category = category;

    await prisma.$transaction([
      // Question-prompt shadow records (only cascade REVIEWED-safe statuses)
      ...(questionIds.length > 0
        ? [prisma.feedback.updateMany({
          where: {
            questionId: { in: questionIds },
            // Don't override REVIEWED — admin explicitly reviewed these
            NOT: { status: "REVIEWED" },
          },
          data: updateData,
        })]
        : []),
      // Employee Q&A response records (matching campaign title in adminNote)
      prisma.feedback.updateMany({
        where: {
          adminNote: { startsWith: `Q&A response · Campaign: ${campaign.title}` },
          // Don't override REVIEWED — admin explicitly reviewed these
          NOT: { status: "REVIEWED" },
        },
        data: updateData,
      }),
    ]);
  }

  return NextResponse.json(campaign);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.campaign.findUnique({
    where: { id: params.id },
    include: { questions: { select: { id: true } } },
  });

  if (!existing) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  const questionIds = existing.questions.map((q) => q.id);

  await prisma.$transaction([
    // Delete question responses first
    ...(questionIds.length > 0
      ? [prisma.questionResponse.deleteMany({ where: { questionId: { in: questionIds } } })]
      : []),
    // Delete questions
    prisma.question.deleteMany({ where: { campaignId: params.id } }),
    // Delete the campaign
    prisma.campaign.delete({ where: { id: params.id } }),
  ]);

  revalidatePath("/admin");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/campaigns");

  return NextResponse.json({ success: true });
}
