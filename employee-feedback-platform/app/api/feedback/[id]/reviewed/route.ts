import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (typeof body?.reviewed !== "boolean") {
    return NextResponse.json({ error: "Invalid payload. 'reviewed' must be a boolean." }, { status: 400 });
  }

  const existing = await prisma.feedback.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "Feedback not found" }, { status: 404 });
  }

  const updated = await prisma.feedback.update({
    where: { id: params.id },
    data: { reviewed: body.reviewed },
  });

  return NextResponse.json(updated);
}
