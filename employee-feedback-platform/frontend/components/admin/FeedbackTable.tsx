"use client";

import { useState, Fragment } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CategoryPills, type CategoryValue } from "@/components/ui/category-pills";
import type {
  FeedbackWithMeta,
  FeedbackCategory,
  FeedbackStatus,
  RewardType,
  RewardStatus,
} from "@/types";

const CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  CULTURE: "Culture",
  TOOLS: "Tools",
  WORKLOAD: "Workload",
  MANAGEMENT: "Management",
  OTHER: "Other",
};

const CATEGORY_VARIANTS: Record<FeedbackCategory, "culture" | "tools" | "workload" | "management" | "other"> = {
  CULTURE: "culture",
  TOOLS: "tools",
  WORKLOAD: "workload",
  MANAGEMENT: "management",
  OTHER: "other",
};

const STATUS_LABELS: Record<FeedbackStatus, string> = {
  PENDING: "Draft",
  REVIEWED: "Live",
  IN_PROGRESS: "Live",
  RESOLVED: "Resolved",
};

const STATUS_VARIANTS: Record<FeedbackStatus, "pending" | "reviewed" | "in_progress" | "resolved"> = {
  PENDING: "pending",
  REVIEWED: "in_progress",
  IN_PROGRESS: "in_progress",
  RESOLVED: "resolved",
};

const REWARD_LABELS: Record<RewardType, string> = {
  PROMO_CODE: "Promo code",
  HOLIDAY_DAY: "Holiday day",
};

const REWARD_STATUS_LABELS: Record<RewardStatus, string> = {
  AWARDED: "Awarded",
  REDEEMED: "Redeemed",
};

interface FeedbackTableProps {
  feedback: FeedbackWithMeta[];
}

export function FeedbackTable({ feedback }: FeedbackTableProps) {
  const [rows, setRows] = useState(feedback);
  const [activeCategory, setActiveCategory] = useState<CategoryValue>("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = rows.filter((f) => activeCategory === "ALL" || f.category === activeCategory);
  const statusCards = [
    { label: "Draft", count: rows.filter((f) => f.status === "PENDING").length },
    {
      label: "Live",
      count: rows.filter((f) => f.status === "REVIEWED" || f.status === "IN_PROGRESS").length,
    },
    { label: "Resolved", count: rows.filter((f) => f.status === "RESOLVED").length },
  ];

  const formattedDate = (d: Date) =>
    new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(d));

  const handleRewarded = (feedbackId: string, reward: NonNullable<FeedbackWithMeta["reward"]>) => {
    setRows((prev) =>
      prev.map((item) => (item.id === feedbackId ? { ...item, reward } : item))
    );
  };

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {statusCards.map((statusCard) => (
          <div key={statusCard.label} className="rounded-xl border border-border bg-card px-5 py-4">
            <p className="text-sm text-muted-foreground mb-1">{statusCard.label}</p>
            <p className="text-3xl font-semibold tabular-nums text-foreground">{statusCard.count}</p>
          </div>
        ))}
      </div>

      <CategoryPills
        active={activeCategory}
        onChange={setActiveCategory}
        counts={{
          ALL: rows.length,
          CULTURE: rows.filter((f) => f.category === "CULTURE").length,
          TOOLS: rows.filter((f) => f.category === "TOOLS").length,
          WORKLOAD: rows.filter((f) => f.category === "WORKLOAD").length,
          MANAGEMENT: rows.filter((f) => f.category === "MANAGEMENT").length,
          OTHER: rows.filter((f) => f.category === "OTHER").length,
        }}
      />

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
          No feedback in this category.
        </div>
      ) : (
        <div className="-mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
          <div className="min-w-[700px] overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-accent/40">
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground w-[40%]">
                  Feedback
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Category
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Status
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Upvotes
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Reward
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((item) => (
                <Fragment key={item.id}>
                  <tr
                    onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                    className="cursor-pointer transition-colors hover:bg-accent/50 active:bg-accent/70"
                  >
                    <td className="px-5 py-4 text-sm text-foreground">
                      <p className="line-clamp-2 leading-relaxed">{item.content}</p>
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={CATEGORY_VARIANTS[item.category]}>
                        {CATEGORY_LABELS[item.category]}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={STATUS_VARIANTS[item.status]}>
                        {STATUS_LABELS[item.status]}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-sm tabular-nums text-muted-foreground">{item.upvotes}</td>
                    <td className="px-5 py-4">
                      {item.reward ? (
                        <Badge>{REWARD_STATUS_LABELS[item.reward.status]}</Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">None</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm text-muted-foreground whitespace-nowrap">
                      {formattedDate(item.createdAt)}
                    </td>
                  </tr>
                  {expandedId === item.id && (
                    <tr className="bg-accent/40">
                      <td colSpan={6} className="px-5 py-5">
                        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                          {item.content}
                        </p>
                        {item.adminNote && (
                          <div className="mt-3 rounded-lg border border-border bg-accent/60 px-3 py-2">
                            <p className="text-xs font-medium text-foreground mb-0.5">Admin note</p>
                            <p className="text-xs text-muted-foreground">{item.adminNote}</p>
                          </div>
                        )}
                        {!item.id.startsWith("campaign-question-") && (
                          <AwardPanel item={item} onRewarded={handleRewarded} />
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}

function AwardPanel({
  item,
  onRewarded,
}: {
  item: FeedbackWithMeta;
  onRewarded: (feedbackId: string, reward: NonNullable<FeedbackWithMeta["reward"]>) => void;
}) {
  const [rewardType, setRewardType] = useState<RewardType>("PROMO_CODE");
  const [promoCode, setPromoCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isPromo = rewardType === "PROMO_CODE";
  const canAward = Boolean(item.submitterSessionId);

  async function handleAward() {
    if (!canAward) return;
    setLoading(true);
    setError(null);
    setSuccess(false);

    const res = await fetch(`/api/feedback/${item.id}/reward`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rewardType,
        promoCode: isPromo ? promoCode : undefined,
      }),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setError(data?.error ?? "Failed to award reward.");
      setLoading(false);
      return;
    }

    onRewarded(item.id, data.reward);
    setSuccess(true);
    setLoading(false);
  }

  if (item.reward) {
    return (
      <div className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3">
        <p className="text-xs font-semibold text-emerald-800">
          {REWARD_STATUS_LABELS[item.reward.status]} reward
        </p>
        <div className="mt-2 space-y-1 text-xs text-emerald-700">
          <p>Type: {REWARD_LABELS[item.reward.rewardType]}</p>
          <p>Claim code: {item.reward.claimCode}</p>
          {item.reward.rewardType === "PROMO_CODE" && item.reward.status === "REDEEMED" && (
            <p>Promo code: {item.reward.promoCode ?? "Unavailable"}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-lg border border-border bg-card px-5 py-4">
      <p className="text-sm font-semibold text-muted-foreground">Award a reward</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-3 sm:items-end">
        <div className="space-y-1.5 sm:col-span-1">
          <label className="text-sm font-medium text-muted-foreground">Reward type</label>
          <select
            value={rewardType}
            onChange={(e) => setRewardType(e.target.value as RewardType)}
            className="w-full cursor-pointer rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
          >
            <option value="PROMO_CODE">Promo code</option>
            <option value="HOLIDAY_DAY">Holiday day</option>
          </select>
        </div>

        <div className="space-y-1.5 sm:col-span-1">
          <label className="text-sm font-medium text-muted-foreground">Promo code</label>
          <input
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
            disabled={!isPromo}
            placeholder={isPromo ? "Enter promo code" : "Not required"}
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20 disabled:bg-accent/40 disabled:text-muted-foreground"
          />
        </div>

        <div className="sm:col-span-1">
          <Button
            type="button"
            size="sm"
            className="w-full"
            disabled={loading || !canAward || (isPromo && promoCode.trim().length === 0)}
            onClick={handleAward}
          >
            {loading ? "Awarding…" : "Award"}
          </Button>
        </div>
      </div>

      {!canAward && (
        <p className="mt-2 text-xs text-amber-500">
          This feedback cannot be awarded because the submitter session is missing.
        </p>
      )}

      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
      {success && (
        <p className="mt-2 text-xs text-emerald-500">
          Reward awarded. Claim code generated for the submitter.
        </p>
      )}
      <p className="mt-2 text-xs text-muted-foreground">
        Awards are limited to 3 per month for each submitter.
      </p>
    </div>
  );
}
