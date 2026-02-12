"use client";

import { useState, useCallback } from "react";
import { FeedbackCard } from "@/components/feedback/FeedbackCard";
import { FeedbackThread } from "@/components/feedback/FeedbackThread";
import { getSessionId } from "@/components/feedback/session";
import type { FeedbackWithMeta, CategoryFilter, SortOption } from "@/types";

const CATEGORY_TABS: { value: CategoryFilter; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "CULTURE", label: "Culture" },
  { value: "TOOLS", label: "Tools" },
  { value: "WORKLOAD", label: "Workload" },
  { value: "MANAGEMENT", label: "Management" },
  { value: "OTHER", label: "Other" },
];

interface FeedbackFeedProps {
  initialFeedback: FeedbackWithMeta[];
}

export function FeedbackFeed({ initialFeedback }: FeedbackFeedProps) {
  const [feedback, setFeedback] = useState<FeedbackWithMeta[]>(initialFeedback);
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("ALL");
  const [sort, setSort] = useState<SortOption>("newest");

  const handleUpvote = useCallback(async (id: string) => {
    const sessionId = getSessionId();
    try {
      const res = await fetch(`/api/feedback/${id}/upvote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      if (!res.ok) return;
      const { upvotes, hasUpvoted } = await res.json();
      setFeedback((prev) =>
        prev.map((f) => (f.id === id ? { ...f, upvotes, hasUpvoted } : f))
      );
    } catch {
      // silently fail
    }
  }, []);

  const filtered = feedback
    .filter((f) => activeCategory === "ALL" || f.category === activeCategory)
    .sort((a, b) =>
      sort === "newest"
        ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        : b.upvotes - a.upvotes
    );

  return (
    <div className="space-y-5">
      {/* Filters row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
            </button>
          ))}
        </div>

        {/* Sort toggle */}
        <div className="flex rounded-lg border border-slate-200 bg-white p-0.5 self-start sm:self-auto">
          {(["newest", "top"] as SortOption[]).map((s) => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                sort === s ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {s === "newest" ? "Newest" : "Most upvoted"}
            </button>
          ))}
        </div>
      </div>

      {/* Feed */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          No feedback in this category yet.
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((item) => (
            <li key={item.id}>
              <FeedbackCard
                feedback={item}
                upvoteSlot={
                  <UpvoteButton
                    count={item.upvotes}
                    hasUpvoted={item.hasUpvoted}
                    onUpvote={() => handleUpvote(item.id)}
                  />
                }
                threadSlot={
                  <FeedbackThread
                    feedbackId={item.id}
                    initialCount={item.commentsCount}
                  />
                }
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface UpvoteButtonProps {
  count: number;
  hasUpvoted: boolean;
  onUpvote: () => void;
}

function UpvoteButton({ count, hasUpvoted, onUpvote }: UpvoteButtonProps) {
  return (
    <button
      onClick={onUpvote}
      className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
        hasUpvoted
          ? "border-slate-900 bg-slate-900 text-white"
          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
      }`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="h-3.5 w-3.5"
      >
        <path
          fillRule="evenodd"
          d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z"
          clipRule="evenodd"
        />
      </svg>
      {count}
    </button>
  );
}
