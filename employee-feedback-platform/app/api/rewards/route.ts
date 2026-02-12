import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

const SESSION_COOKIE = "efp_session_id";

function getSessionId(req: NextRequest): string {
  const cookieStore = cookies();
  return cookieStore.get(SESSION_COOKIE)?.value ?? req.headers.get("x-session-id") ?? "";
}

export async function GET(req: NextRequest) {
  const sessionId = getSessionId(req);
  if (!sessionId) {
    return NextResponse.json([]);
  }

  const rewards = await prisma.reward.findMany({
    where: { feedback: { submitterSessionId: sessionId } },
    orderBy: { awardedAt: "desc" },
    include: {
      feedback: {
        select: {
          id: true,
          content: true,
          category: true,
          createdAt: true,
        },
      },
    },
  });

  const result = rewards.map((reward) => ({
    id: reward.id,
    rewardType: reward.rewardType,
    status: reward.status,
    claimCode: reward.claimCode,
    awardedAt: reward.awardedAt,
    redeemedAt: reward.redeemedAt,
    promoCode: reward.status === "REDEEMED" ? reward.promoCode : null,
    feedback: reward.feedback,
  }));

  return NextResponse.json(result);
}
