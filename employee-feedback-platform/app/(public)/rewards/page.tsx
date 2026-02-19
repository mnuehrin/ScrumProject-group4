"use client";

import { useEffect, useState } from "react";
import { getSessionId } from "@/components/feedback/session";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type RewardItem = {
  id: string;
  rewardType: "PROMO_CODE" | "HOLIDAY_DAY";
  status: "AWARDED" | "REDEEMED";
  claimCode: string;
  promoCode: string | null;
  awardedAt: string;
  redeemedAt: string | null;
  feedback: {
    id: string;
    content: string;
    category: string;
    createdAt: string;
  };
};

const REWARD_LABELS: Record<RewardItem["rewardType"], string> = {
  PROMO_CODE: "Promo code",
  HOLIDAY_DAY: "Holiday day",
};

const STATUS_LABELS: Record<RewardItem["status"], string> = {
  AWARDED: "Awarded",
  REDEEMED: "Redeemed",
};

export default function RewardsPage() {
  const [rewards, setRewards] = useState<RewardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRewards() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/rewards", {
          headers: { "x-session-id": getSessionId() },
        });
        const data = await res.json();
        setRewards(Array.isArray(data) ? data : []);
      } catch {
        setError("Unable to load rewards.");
      } finally {
        setLoading(false);
      }
    }

    loadRewards();
  }, []);

  async function handleRedeem(claimCode: string) {
    setRedeeming(claimCode);
    setError(null);
    try {
      const res = await fetch("/api/rewards/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claimCode, sessionId: getSessionId() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Unable to redeem reward.");
        setRedeeming(null);
        return;
      }

      setRewards((prev) =>
        prev.map((reward) =>
          reward.claimCode === claimCode
            ? {
                ...reward,
                status: "REDEEMED",
                promoCode: data.reward?.promoCode ?? reward.promoCode,
                redeemedAt: data.reward?.redeemedAt ?? reward.redeemedAt,
              }
            : reward
        )
      );
      setRedeeming(null);
    } catch {
      setError("Unable to redeem reward.");
      setRedeeming(null);
    }
  }

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="sr-only">My rewards</h1>
        <p className="text-sm leading-relaxed text-slate-600">
          Rewards appear here after an admin awards your feedback. Use your claim code to redeem.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          Loading rewards…
        </div>
      ) : rewards.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          No rewards yet.
        </div>
      ) : (
        <div className="space-y-3">
          {rewards.map((reward) => (
            <div
              key={reward.id}
              className="rounded-xl border border-slate-200 bg-white p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge>{REWARD_LABELS[reward.rewardType]}</Badge>
                    <Badge>{STATUS_LABELS[reward.status]}</Badge>
                  </div>
                  <p className="text-xs text-slate-400">
                    Claim code: <span className="font-medium">{reward.claimCode}</span>
                  </p>
                </div>
                {reward.status === "AWARDED" ? (
                  <Button
                    size="sm"
                    onClick={() => handleRedeem(reward.claimCode)}
                    disabled={redeeming === reward.claimCode}
                  >
                    {redeeming === reward.claimCode ? "Redeeming…" : "Redeem"}
                  </Button>
                ) : (
                  <span className="text-xs text-emerald-600">Redeemed</span>
                )}
              </div>

              {reward.status === "REDEEMED" && reward.rewardType === "PROMO_CODE" && (
                <p className="mt-3 text-sm text-emerald-700">
                  Promo code: <span className="font-semibold">{reward.promoCode ?? "Unavailable"}</span>
                </p>
              )}

              <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50 p-3">
                <p className="text-xs text-slate-500 mb-1">Feedback</p>
                <p className="text-sm text-slate-700 line-clamp-2">{reward.feedback.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}

    </section>
  );
}
