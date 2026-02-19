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
      sessionId: true,
      content: true,
      createdAt: true,
    },
  });

  return NextResponse.json(
    responses.map((response) => ({
      id: response.id,
      questionId: response.questionId,
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

  const { sessionId, content } = parsed.data;

  const question = await prisma.question.findUnique({
    where: { id: params.id },
    select: { id: true },
  });
  if (!question) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  const existing = await prisma.questionResponse.findUnique({
    where: { questionId_sessionId: { questionId: params.id, sessionId } },
  });

  if (existing) {
    return NextResponse.json(
      { error: "You have already responded to this question." },
      { status: 409 }
    );
  }

  const response = await prisma.questionResponse.create({
    data: {
      questionId: params.id,
      sessionId,
      content: content.trim(),
    },
  });

  return NextResponse.json(response, { status: 201 });
}
