"use client";

import { useState, useCallback } from "react";
import { FeedbackCard } from "@/components/feedback/FeedbackCard";
import { FeedbackThread } from "@/components/feedback/FeedbackThread";
import { QuestionThread } from "@/components/feedback/QuestionThread";
import { getSessionId } from "@/components/feedback/session";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { CategoryPills, type CategoryValue } from "@/components/ui/category-pills";
import type { FeedbackWithMeta, CategoryFilter, SortOption, FeedbackCategory } from "@/types";

interface FeedbackFeedProps {
  initialFeedback: FeedbackWithMeta[];
  initialCampaignQuestions: CampaignQuestionItem[];
}

export function FeedbackFeed({ initialFeedback, initialCampaignQuestions }: FeedbackFeedProps) {
  const [feedback, setFeedback] = useState<FeedbackWithMeta[]>(initialFeedback);
  const [campaignQuestions, setCampaignQuestions] = useState<CampaignQuestionItem[]>(
    initialCampaignQuestions
  );
  const [activeCategory, setActiveCategory] = useState<CategoryValue>("ALL");
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

  const items: FeedItem[] = [
    ...campaignQuestions.map((item) => ({ kind: "question" as const, data: item })),
    ...feedback.map((item) => ({ kind: "feedback" as const, data: item })),
  ];

  const filtered = items
    .filter((item) =>
      activeCategory === "ALL"
        ? true
        : item.kind === "feedback"
          ? item.data.category === activeCategory
          : item.data.category === activeCategory
    )
    .sort((a, b) => {
      if (sort === "newest") {
        return (
          new Date(b.data.createdAt).getTime() - new Date(a.data.createdAt).getTime()
        );
      }
      const aScore = a.kind === "feedback" ? a.data.upvotes : a.data.responsesCount;
      const bScore = b.kind === "feedback" ? b.data.upvotes : b.data.responsesCount;
      return bScore - aScore;
    });

  return (
    <div className="space-y-5">
      {/* Filters row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <CategoryPills active={activeCategory} onChange={setActiveCategory} />

        {/* Sort toggle */}
        <div className="flex flex-nowrap items-center gap-2.5 self-start sm:mr-4 sm:self-auto">
          {(["newest", "top"] as SortOption[]).map((s) => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={`cursor-pointer whitespace-nowrap rounded-full border px-4 py-1.5 text-[13px] font-semibold transition-all ${
                sort === s
                  ? "border-transparent bg-primary text-primary-foreground shadow-sm"
                  : "border-border bg-card/80 text-muted-foreground hover:bg-accent/60 hover:text-foreground"
              }`}
            >
              {s === "newest" ? "Newest" : "Most upvoted"}
            </button>
          ))}
        </div>
      </div>

      {/* Feed */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
          No feedback in this category yet.
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((item) => {
            if (item.kind === "feedback") {
              return (
                <li key={item.data.id}>
                  <FeedbackCard
                    feedback={item.data}
                    upvoteSlot={
                      <UpvoteButton
                        count={item.data.upvotes}
                        hasUpvoted={item.data.hasUpvoted}
                        onUpvote={() => handleUpvote(item.data.id)}
                      />
                    }
                    threadSlot={
                      <FeedbackThread
                        feedbackId={item.data.id}
                        initialCount={item.data.commentsCount}
                      />
                    }
                  />
                </li>
              );
            }

            return (
              <li key={item.data.id}>
                <CampaignQuestionCard
                  question={item.data}
                  threadSlot={
                    <QuestionThread
                      questionId={item.data.id}
                      initialCount={item.data.responsesCount}
                      onResponded={() =>
                        setCampaignQuestions((prev) =>
                          prev.map((q) =>
                            q.id === item.data.id
                              ? { ...q, responsesCount: q.responsesCount + 1 }
                              : q
                          )
                        )
                      }
                    />
                  }
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

type CampaignQuestionItem = {
  id: string;
  campaignTitle: string;
  campaignDescription: string | null;
  category: FeedbackCategory;
  prompt: string;
  createdAt: Date;
  responsesCount: number;
};

type FeedItem =
  | { kind: "feedback"; data: FeedbackWithMeta }
  | { kind: "question"; data: CampaignQuestionItem };

function CampaignQuestionCard({
  question,
  threadSlot,
}: {
  question: CampaignQuestionItem;
  threadSlot: React.ReactNode;
}) {
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(question.createdAt));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={CATEGORY_VARIANTS[question.category]}>
              {CATEGORY_LABELS[question.category]}
            </Badge>
            <Badge variant="pending">Campaign</Badge>
          </div>
          <span className="shrink-0 text-xs text-muted-foreground">{formattedDate}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm font-semibold text-foreground">{question.campaignTitle}</p>
        {question.campaignDescription && (
          <p className="text-xs text-muted-foreground">{question.campaignDescription}</p>
        )}
        <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
          {question.prompt}
        </p>
      </CardContent>
      <CardFooter>
        <div className="flex items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-2 text-sm font-medium text-muted-foreground">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-4 w-4"
          >
            <path d="M10 3c-3.866 0-7 2.686-7 6 0 1.576.706 3.01 1.86 4.086-.144.94-.5 2.054-1.17 3.214a.75.75 0 00.905 1.08c1.64-.498 3.03-1.114 4.106-1.778.84.248 1.737.398 2.649.398 3.866 0 7-2.686 7-6s-3.134-6-7-6z" />
          </svg>
          <span className="tabular-nums">{question.responsesCount}</span>
        </div>
      </CardFooter>
      <CardContent>{threadSlot}</CardContent>
    </Card>
  );
}

const CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  CULTURE: "Culture",
  TOOLS: "Tools",
  WORKLOAD: "Workload",
  MANAGEMENT: "Management",
  OTHER: "Other",
};

const CATEGORY_VARIANTS: Record<
  FeedbackCategory,
  "culture" | "tools" | "workload" | "management" | "other"
> = {
  CULTURE: "culture",
  TOOLS: "tools",
  WORKLOAD: "workload",
  MANAGEMENT: "management",
  OTHER: "other",
};

interface UpvoteButtonProps {
  count: number;
  hasUpvoted: boolean;
  onUpvote: () => void;
}

function UpvoteButton({ count, hasUpvoted, onUpvote }: UpvoteButtonProps) {
  return (
    <button
      onClick={onUpvote}
      className={`flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all ${
        hasUpvoted
          ? "border-primary bg-primary text-primary-foreground shadow-sm"
          : "border-border bg-card text-muted-foreground hover:border-border hover:bg-accent/70 hover:text-foreground active:bg-accent"
      } min-w-[78px] justify-center`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="h-4 w-4"
      >
        <path
          fillRule="evenodd"
          d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z"
          clipRule="evenodd"
        />
      </svg>
      <span className="tabular-nums">{count}</span>
    </button>
  );
}
