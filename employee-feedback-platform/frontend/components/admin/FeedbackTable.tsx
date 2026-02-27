"use client";

import { useState, Fragment, useCallback } from "react";
import { useRouter } from "next/navigation";
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

interface FeedbackTableProps {
  feedback: FeedbackWithMeta[];
}

export function FeedbackTable({ feedback }: FeedbackTableProps) {
  const router = useRouter();
  const [rows, setRows] = useState(feedback);
  const [activeCategory, setActiveCategory] = useState<CategoryValue>("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

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

  const handleToggleReviewed = useCallback(async (feedbackId: string, currentStatus: FeedbackStatus) => {
    const newStatus: FeedbackStatus = currentStatus === "PENDING" ? "REVIEWED" : "PENDING";

    // Optimistic update
    setRows((prev) =>
      prev.map((item) =>
        item.id === feedbackId ? { ...item, status: newStatus } : item
      )
    );
    setUpdatingIds((prev) => new Set(prev).add(feedbackId));

    try {
      const res = await fetch(`/api/feedback/${feedbackId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        // Revert on failure
        setRows((prev) =>
          prev.map((item) =>
            item.id === feedbackId ? { ...item, status: currentStatus } : item
          )
        );
      }
    } catch {
      // Revert on network error
      setRows((prev) =>
        prev.map((item) =>
          item.id === feedbackId ? { ...item, status: currentStatus } : item
        )
      );
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev);
        next.delete(feedbackId);
        return next;
      });
    }
  }, []);

  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const confirmDelete = useCallback(async () => {
    if (!pendingDeleteId) return;
    const feedbackId = pendingDeleteId;
    setPendingDeleteId(null);

    setDeletingIds((prev) => new Set(prev).add(feedbackId));

    const removedItem = rows.find((item) => item.id === feedbackId);

    // Optimistic removal
    setRows((prev) => prev.filter((item) => item.id !== feedbackId));
    if (expandedId === feedbackId) setExpandedId(null);

    try {
      const res = await fetch(`/api/feedback/${feedbackId}`, { method: "DELETE" });
      if (!res.ok) {
        // Revert the removed item back
        if (removedItem) setRows((prev) => [...prev, removedItem].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      } else {
        router.refresh();
      }
    } catch {
      if (removedItem) setRows((prev) => [...prev, removedItem].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(feedbackId);
        return next;
      });
    }
  }, [pendingDeleteId, expandedId]);

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(["PENDING", "REVIEWED", "IN_PROGRESS", "RESOLVED"] as FeedbackStatus[]).map((s) => {
          const count = rows.filter((f) => f.status === s).length;
          return (
            <div key={s} className="rounded-xl border border-border bg-card px-5 py-4">
              <p className="text-sm text-muted-foreground mb-1">{STATUS_LABELS[s]}</p>
              <p className="text-3xl font-semibold tabular-nums text-foreground">{count}</p>
            </div>
          );
        })}
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
          <div className="min-w-[750px] overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-accent/40">
                <th className="px-3 py-3.5 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground w-[60px]">
                  Reviewed
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground w-[38%]">
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
                <th className="px-3 py-3.5 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground w-[50px]">
                  
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((item) => {
                const isReviewed = item.status !== "PENDING";
                const isToggleable = item.status === "PENDING" || item.status === "REVIEWED";
                const isUpdating = updatingIds.has(item.id);

                return (
                  <Fragment key={item.id}>
                    <tr
                      onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                      className="cursor-pointer transition-colors hover:bg-accent/50 active:bg-accent/70"
                    >
                      <td className="px-3 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={isReviewed}
                          disabled={!isToggleable || isUpdating}
                          title={
                            !isToggleable
                              ? `Status is "${STATUS_LABELS[item.status]}" — cannot toggle`
                              : isReviewed
                              ? "Unmark as reviewed"
                              : "Mark as reviewed"
                          }
                          onClick={(e) => e.stopPropagation()}
                          onChange={() => handleToggleReviewed(item.id, item.status)}
                          className="h-4 w-4 cursor-pointer rounded border-border text-primary accent-primary focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </td>
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
                      <td className="px-3 py-4 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPendingDeleteId(item.id);
                          }}
                          disabled={deletingIds.has(item.id)}
                          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-950/40 disabled:opacity-50"
                          title="Delete feedback"
                        >
                          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                            <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                    {expandedId === item.id && (
                      <tr className="bg-accent/40">
                        <td colSpan={8} className="px-5 py-5">
                          <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                            {item.content}
                          </p>
                          {item.adminNote && (
                            <div className="mt-3 rounded-lg border border-border bg-accent/60 px-3 py-2">
                              <p className="text-xs font-medium text-foreground mb-0.5">Admin note</p>
                              <p className="text-xs text-muted-foreground">{item.adminNote}</p>
                            </div>
                          )}
                          <AwardPanel item={item} onRewarded={handleRewarded} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {pendingDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-xl">
            <h3 className="text-base font-semibold text-foreground">Delete feedback?</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              This will permanently remove this feedback and all its comments, votes, and rewards. This action cannot be undone.
            </p>
            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                onClick={() => setPendingDeleteId(null)}
                className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
              >
                Delete
              </button>
            </div>
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

  async function handleAward() {
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
            disabled={loading || (isPromo && promoCode.trim().length === 0)}
            onClick={handleAward}
          >
            {loading ? "Awarding…" : "Award"}
          </Button>
        </div>
      </div>

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
