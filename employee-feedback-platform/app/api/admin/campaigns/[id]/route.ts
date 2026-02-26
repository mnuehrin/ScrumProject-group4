import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { updateCampaignSchema } from "@/lib/validations";

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

  // Sync linked Feedback records when status or category changes
  if (status || category) {
    const statusMap = { LIVE: "IN_PROGRESS", ARCHIVED: "RESOLVED", DRAFT: "PENDING" } as const;
    const questionIds = campaign.questions.map((q) => q.id);
    if (questionIds.length > 0) {
      const updateData: Record<string, unknown> = {};
      if (status) updateData.status = statusMap[status] ?? "PENDING";
      if (category) updateData.category = category;
      await prisma.feedback.updateMany({
        where: { questionId: { in: questionIds } },
        data: updateData,
      });
    }
  }

  return NextResponse.json(campaign);
}
