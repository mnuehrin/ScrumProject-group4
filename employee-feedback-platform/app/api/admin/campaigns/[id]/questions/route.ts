import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { createQuestionSchema } from "@/lib/validations";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createQuestionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const campaign = await prisma.campaign.findUnique({
    where: { id: params.id },
    select: { id: true, title: true, category: true, status: true },
  });
  if (!campaign) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const { prompt, type, order } = parsed.data;

  const nextOrder =
    typeof order === "number"
      ? order
      : (await prisma.question.count({ where: { campaignId: params.id } })) + 1;

  const statusMap = { LIVE: "IN_PROGRESS", ARCHIVED: "RESOLVED", DRAFT: "PENDING" } as const;

  const question = await prisma.question.create({
    data: {
      campaignId: params.id,
      prompt: prompt.trim(),
      type: type ?? "TEXT",
      order: nextOrder,
      feedback: {
        create: {
          content: prompt.trim(),
          category: campaign.category,
          status: statusMap[campaign.status] ?? "PENDING",
          adminNote: `Post: ${campaign.title}`,
        },
      },
    },
  });

  return NextResponse.json(question, { status: 201 });
}
