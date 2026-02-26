import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

const VALID_STATUSES = ["PENDING", "REVIEWED", "IN_PROGRESS", "RESOLVED"] as const;
type ValidStatus = (typeof VALID_STATUSES)[number];

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const status = body?.status as string | undefined;

  if (!status || !VALID_STATUSES.includes(status as ValidStatus)) {
    return NextResponse.json(
      { error: "Invalid status. Must be one of: " + VALID_STATUSES.join(", ") },
      { status: 400 }
    );
  }

  const existing = await prisma.feedback.findUnique({
    where: { id: params.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Feedback not found" }, { status: 404 });
  }

  const updated = await prisma.feedback.update({
    where: { id: params.id },
    data: {
      status: status as ValidStatus,
      statusUpdatedAt: new Date(),
      statusUpdatedBy: session.user?.email ?? "admin",
    },
  });

  await prisma.activityLog.create({
    data: {
      feedbackId: params.id,
      action: "STATUS_CHANGED",
      details: {
        from: existing.status,
        to: status,
        updatedBy: session.user?.email ?? "admin",
      },
    },
  });

  return NextResponse.json(updated);
}
