import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const campaignId = searchParams.get("campaignId");

  if (!campaignId) {
    return NextResponse.json({ error: "campaignId is required" }, { status: 400 });
  }

  const questions = await prisma.question.findMany({
    where: { campaignId },
    orderBy: { order: "asc" },
    select: {
      id: true,
      campaignId: true,
      prompt: true,
      type: true,
      order: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ questions });
}