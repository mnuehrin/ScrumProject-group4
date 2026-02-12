"use client";

import { useState, Fragment } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type {
  FeedbackWithMeta,
  FeedbackCategory,
  FeedbackStatus,
  CategoryFilter,
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
  PENDING: "Pending",
  REVIEWED: "Reviewed",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
};

const STATUS_VARIANTS: Record<FeedbackStatus, "pending" | "reviewed" | "in_progress" | "resolved"> = {
  PENDING: "pending",
  REVIEWED: "reviewed",
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

const CATEGORY_TABS: { value: CategoryFilter; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "CULTURE", label: "Culture" },
  { value: "TOOLS", label: "Tools" },
  { value: "WORKLOAD", label: "Workload" },
  { value: "MANAGEMENT", label: "Management" },
  { value: "OTHER", label: "Other" },
];

interface FeedbackTableProps {
  feedback: FeedbackWithMeta[];
}

export function FeedbackTable({ feedback }: FeedbackTableProps) {
  const [rows, setRows] = useState(feedback);
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = rows.filter((f) => activeCategory === "ALL" || f.category === activeCategory);

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
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(["PENDING", "REVIEWED", "IN_PROGRESS", "RESOLVED"] as FeedbackStatus[]).map((s) => {
          const count = rows.filter((f) => f.status === s).length;
          return (
            <div key={s} className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs text-slate-500 mb-1">{STATUS_LABELS[s]}</p>
              <p className="text-2xl font-semibold text-slate-900">{count}</p>
            </div>
          );
        })}
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-1.5">
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveCategory(tab.value)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              activeCategory === tab.value
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {tab.label}
            <span className="ml-1.5 text-xs opacity-70">
              {tab.value === "ALL"
                ? rows.length
                : rows.filter((f) => f.category === tab.value).length}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          No feedback in this category.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 w-[45%]">
                  Feedback
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">
                  Upvotes
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">
                  Reward
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((item) => (
                <Fragment key={item.id}>
                  <tr
                    onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                    className="cursor-pointer transition-colors hover:bg-slate-50"
                  >
                    <td className="px-4 py-3 text-slate-700">
                      <p className="line-clamp-2">{item.content}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={CATEGORY_VARIANTS[item.category]}>
                        {CATEGORY_LABELS[item.category]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_VARIANTS[item.status]}>
                        {STATUS_LABELS[item.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{item.upvotes}</td>
                    <td className="px-4 py-3">
                      {item.reward ? (
                        <Badge>{REWARD_STATUS_LABELS[item.reward.status]}</Badge>
                      ) : (
                        <span className="text-xs text-slate-400">None</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {formattedDate(item.createdAt)}
                    </td>
                  </tr>
                  {expandedId === item.id && (
                    <tr className="bg-slate-50">
                      <td colSpan={6} className="px-4 py-4">
                        <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                          {item.content}
                        </p>
                        {item.adminNote && (
                          <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2">
                            <p className="text-xs font-medium text-blue-700 mb-0.5">Admin note</p>
                            <p className="text-xs text-blue-600">{item.adminNote}</p>
                          </div>
                        )}
                        <AwardPanel item={item} onRewarded={handleRewarded} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
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
    <div className="mt-4 rounded-lg border border-slate-200 bg-white px-4 py-3">
      <p className="text-xs font-semibold text-slate-600">Award a reward</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-3 sm:items-end">
        <div className="space-y-1 sm:col-span-1">
          <label className="text-xs font-medium text-slate-600">Reward type</label>
          <select
            value={rewardType}
            onChange={(e) => setRewardType(e.target.value as RewardType)}
            className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
          >
            <option value="PROMO_CODE">Promo code</option>
            <option value="HOLIDAY_DAY">Holiday day</option>
          </select>
        </div>

        <div className="space-y-1 sm:col-span-1">
          <label className="text-xs font-medium text-slate-600">Promo code</label>
          <input
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
            disabled={!isPromo}
            placeholder={isPromo ? "Enter promo code" : "Not required"}
            className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:bg-slate-50 disabled:text-slate-400"
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
        <p className="mt-2 text-xs text-amber-600">
          This feedback cannot be awarded because the submitter session is missing.
        </p>
      )}

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      {success && (
        <p className="mt-2 text-xs text-emerald-700">
          Reward awarded. Claim code generated for the submitter.
        </p>
      )}
      <p className="mt-2 text-xs text-slate-400">
        Awards are limited to 3 per month for each submitter.
      </p>
    </div>
  );
}
