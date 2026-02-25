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
    select: { id: true },
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

  const response = await prisma.questionResponse.create({
    data: {
      questionId: params.id,
      sessionId,
      content: content.trim(),
      parentId: parentId ?? null,
    },
  });

  return NextResponse.json(response, { status: 201 });
}
