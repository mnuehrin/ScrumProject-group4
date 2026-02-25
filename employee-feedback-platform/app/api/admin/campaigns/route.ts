import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { createCampaignSchema } from "@/lib/validations";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const campaigns = await prisma.campaign.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      questions: {
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        include: { _count: { select: { responses: true } } },
      },
    },
  });

  const result = campaigns.map((campaign) => ({
    ...campaign,
    questions: campaign.questions.map(({ _count, ...question }) => ({
      ...question,
      responsesCount: _count.responses,
    })),
  }));

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createCampaignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { title, description, startsAt, endsAt, status, category } = parsed.data;

  const campaign = await prisma.campaign.create({
    data: {
      title: title.trim(),
      description: description?.trim() || null,
      category,
      startsAt: startsAt ? new Date(startsAt) : null,
      endsAt: endsAt ? new Date(endsAt) : null,
      status: status ?? "DRAFT",
    },
  });

  return NextResponse.json(campaign, { status: 201 });
}
