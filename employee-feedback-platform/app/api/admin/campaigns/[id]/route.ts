import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { updateCampaignSchema } from "@/lib/validations";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = updateCampaignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { title, description, startsAt, endsAt, status, category } = parsed.data;

  const campaign = await prisma.campaign.update({
    where: { id: params.id },
    data: {
      title: title?.trim(),
      description: description?.trim() ?? undefined,
      startsAt: startsAt === null ? null : startsAt ? new Date(startsAt) : undefined,
      endsAt: endsAt === null ? null : endsAt ? new Date(endsAt) : undefined,
      category,
      status,
    },
  });

  return NextResponse.json(campaign);
}
