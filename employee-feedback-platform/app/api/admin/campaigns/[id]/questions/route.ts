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

  // Create the Question and its linked Feedback record together in a transaction.
  // The Feedback record gives this Q&A item full admin visibility: status lifecycle,
  // rewards, reviewed checkbox — everything the Submit Feedback path already has.
  // The Feedback Feed hides it via the `where: { questionId: null }` filter so
  // the linked record never shows up as a duplicate on the public feed.
  const [question] = await prisma.$transaction(async (tx) => {
    const q = await tx.question.create({
      data: {
        campaignId: params.id,
        prompt: prompt.trim(),
        type: type ?? "TEXT",
        order: nextOrder,
      },
    });

    await tx.feedback.create({
      data: {
        content: prompt.trim(),
        category: campaign.category,
        status: statusMap[campaign.status] ?? "PENDING",
        questionId: q.id, // ← the critical link — prevents duplication
        adminNote: `Campaign: ${campaign.title}`,
      },
    });

    return [q];
  });

  return NextResponse.json(question, { status: 201 });
}
