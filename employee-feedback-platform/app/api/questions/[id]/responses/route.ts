import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { submitResponseSchema } from "@/lib/validations";

function toAuthorLabel(sessionId: string) {
  return `Anon-${sessionId.slice(-4).toUpperCase()}`;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const question = await prisma.question.findUnique({
    where: { id: params.id },
    select: { id: true },
  });
  if (!question) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  const responses = await prisma.questionResponse.findMany({
    where: { questionId: params.id },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      questionId: true,
      parentId: true,
      sessionId: true,
      content: true,
      createdAt: true,
    },
  });

  return NextResponse.json(
    responses.map((response) => ({
      id: response.id,
      questionId: response.questionId,
      parentId: response.parentId,
      content: response.content,
      createdAt: response.createdAt,
      authorLabel: toAuthorLabel(response.sessionId),
    }))
  );
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json().catch(() => null);
  const parsed = submitResponseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { sessionId, content, parentId } = parsed.data;

  const question = await prisma.question.findUnique({
    where: { id: params.id },
    include: { campaign: { select: { title: true, category: true, status: true } } },
  });
  if (!question) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  if (!parentId) {
    const existing = await prisma.questionResponse.findFirst({
      where: { questionId: params.id, sessionId, parentId: null },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        { error: "You have already responded to this question." },
        { status: 409 }
      );
    }
  } else {
    const parent = await prisma.questionResponse.findUnique({
      where: { id: parentId },
      select: { id: true, questionId: true },
    });
    if (!parent || parent.questionId !== params.id) {
      return NextResponse.json(
        { error: "Parent response not found for this question." },
        { status: 400 }
      );
    }
  }

  // For root-level responses (not replies), create a linked Feedback record
  // alongside the QuestionResponse. This mirrors the Submit Feedback flow:
  // the Feedback carries the employee's sessionId so the admin can reward it
  // and the employee can see the reward in "My Rewards". Reply threads don't
  // get a Feedback record since only top-level answers should be rewardable.
  const campaignStatusMap = {
    LIVE: "IN_PROGRESS",
    ARCHIVED: "RESOLVED",
    DRAFT: "PENDING",
  } as const;

  const response = await prisma.$transaction(async (tx) => {
    const qr = await tx.questionResponse.create({
      data: {
        questionId: params.id,
        sessionId,
        content: content.trim(),
        parentId: parentId ?? null,
      },
    });

    if (!parentId) {
      await tx.feedback.create({
        data: {
          content: content.trim(),
          category: question.campaign.category,
          status: "PENDING",
          submitterSessionId: sessionId,
          adminNote: `Q&A response · Campaign: ${question.campaign.title}`,
        },
      });
    }

    return qr;
  });

  return NextResponse.json(response, { status: 201 });
}

