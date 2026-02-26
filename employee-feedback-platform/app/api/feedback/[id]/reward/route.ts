import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { randomUUID } from "crypto";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { awardSchema } from "@/lib/validations";

function createClaimCode() {
  return randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase();
}

async function generateClaimCode() {
  for (let i = 0; i < 5; i += 1) {
    const code = createClaimCode();
    const exists = await prisma.reward.findUnique({ where: { claimCode: code } });
    if (!exists) return code;
  }
  throw new Error("Unable to generate unique claim code.");
}

function getMonthWindow(now: Date) {
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { start, end };
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = awardSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const feedbackId = params.id;
  const feedback = await prisma.feedback.findUnique({
    where: { id: feedbackId },
    include: { reward: true },
  });

  if (!feedback) {
    return NextResponse.json({ error: "Feedback not found" }, { status: 404 });
  }

  if (feedback.reward) {
    return NextResponse.json(
      { error: "Feedback already has a reward." },
      { status: 409 }
    );
  }

  // Only enforce per-submitter monthly limit for employee-submitted feedback
  if (feedback.submitterSessionId) {
    const now = new Date();
    const { start, end } = getMonthWindow(now);
    const awardCount = await prisma.reward.count({
      where: {
        awardedAt: { gte: start, lt: end },
        feedback: { submitterSessionId: feedback.submitterSessionId },
      },
    });

    if (awardCount >= 3) {
      return NextResponse.json(
        { error: "Monthly award limit reached for this submitter." },
        { status: 429 }
      );
    }
  }

  const { rewardType, promoCode } = parsed.data;
  const claimCode = await generateClaimCode();

  const reward = await prisma.reward.create({
    data: {
      feedbackId,
      rewardType,
      claimCode,
      promoCode: rewardType === "PROMO_CODE" ? promoCode?.trim() : null,
      awardedBy: session.user?.email ?? "admin",
    },
  });

  await prisma.activityLog.create({
    data: {
      feedbackId,
      action: "REWARDED",
      details: {
        rewardType: reward.rewardType,
        claimCode: reward.claimCode,
      },
    },
  });

  return NextResponse.json({ reward });
}
