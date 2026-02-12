import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { redeemRewardSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = redeemRewardSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { claimCode, sessionId } = parsed.data;

  const reward = await prisma.reward.findUnique({
    where: { claimCode },
    include: { feedback: true },
  });

  if (!reward) {
    return NextResponse.json({ error: "Invalid claim code." }, { status: 404 });
  }

  if (reward.status === "REDEEMED") {
    return NextResponse.json({ error: "Reward already redeemed." }, { status: 409 });
  }

  if (reward.feedback.submitterSessionId !== sessionId) {
    return NextResponse.json({ error: "Not authorized to redeem." }, { status: 403 });
  }

  const updated = await prisma.reward.update({
    where: { id: reward.id },
    data: { status: "REDEEMED", redeemedAt: new Date() },
  });

  await prisma.activityLog.create({
    data: {
      feedbackId: reward.feedbackId,
      action: "REDEEMED",
      details: {
        rewardType: reward.rewardType,
        claimCode: reward.claimCode,
      },
    },
  });

  return NextResponse.json({
    reward: {
      id: updated.id,
      rewardType: updated.rewardType,
      status: updated.status,
      promoCode: updated.promoCode,
      redeemedAt: updated.redeemedAt,
    },
  });
}
