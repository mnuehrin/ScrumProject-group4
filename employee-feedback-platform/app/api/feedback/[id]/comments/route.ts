import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createCommentSchema } from "@/lib/validations";

function toAuthorLabel(sessionId: string) {
  return `Anon-${sessionId.slice(-4).toUpperCase()}`;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const feedbackId = params.id;
  const feedback = await prisma.feedback.findUnique({
    where: { id: feedbackId },
    select: { id: true, submitterSessionId: true },
  });

  if (!feedback) {
    return NextResponse.json({ error: "Feedback not found." }, { status: 404 });
  }

  const comments = await prisma.feedbackComment.findMany({
    where: { feedbackId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      feedbackId: true,
      parentId: true,
      sessionId: true,
      content: true,
      createdAt: true,
    },
  });

  return NextResponse.json(
    comments.map((comment) => ({
      id: comment.id,
      feedbackId: comment.feedbackId,
      parentId: comment.parentId,
      content: comment.content,
      createdAt: comment.createdAt,
      authorLabel: toAuthorLabel(comment.sessionId),
      isOriginalPoster:
        Boolean(feedback.submitterSessionId) &&
        comment.sessionId === feedback.submitterSessionId,
    }))
  );
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const feedbackId = params.id;
  const body = await req.json().catch(() => null);
  const parsed = createCommentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const feedback = await prisma.feedback.findUnique({
    where: { id: feedbackId },
    select: { id: true, submitterSessionId: true },
  });
  if (!feedback) {
    return NextResponse.json({ error: "Feedback not found." }, { status: 404 });
  }

  const { sessionId, content, parentId } = parsed.data;

  if (parentId) {
    const parent = await prisma.feedbackComment.findUnique({
      where: { id: parentId },
      select: { id: true, feedbackId: true },
    });

    if (!parent || parent.feedbackId !== feedbackId) {
      return NextResponse.json(
        { error: "Parent comment not found for this feedback." },
        { status: 400 }
      );
    }
  }

  const comment = await prisma.feedbackComment.create({
    data: {
      feedbackId,
      sessionId,
      content: content.trim(),
      parentId: parentId ?? null,
    },
    select: {
      id: true,
      feedbackId: true,
      parentId: true,
      sessionId: true,
      content: true,
      createdAt: true,
    },
  });

  await prisma.activityLog.create({
    data: {
      feedbackId,
      action: "COMMENTED",
      details: {
        commentId: comment.id,
        parentId: comment.parentId,
      },
    },
  });

  return NextResponse.json(
    {
      id: comment.id,
      feedbackId: comment.feedbackId,
      parentId: comment.parentId,
      content: comment.content,
      createdAt: comment.createdAt,
      authorLabel: toAuthorLabel(comment.sessionId),
      isOriginalPoster:
        Boolean(feedback.submitterSessionId) &&
        comment.sessionId === feedback.submitterSessionId,
    },
    { status: 201 }
  );
}
