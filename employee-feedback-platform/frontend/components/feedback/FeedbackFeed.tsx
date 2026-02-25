"use client";

import { useState, useCallback, useRef } from "react";
import { FeedbackCard } from "@/components/feedback/FeedbackCard";
import { FeedbackThread } from "@/components/feedback/FeedbackThread";
import { QuestionThread } from "@/components/feedback/QuestionThread";
import { getSessionId } from "@/components/feedback/session";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { CategoryPills, type CategoryValue } from "@/components/ui/category-pills";
import type { FeedbackWithMeta, SortOption, FeedbackCategory } from "@/types";

/* ------------------------------------------------------------------ */
/*  Main feed                                                          */
/* ------------------------------------------------------------------ */

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

  const inflightRef = useRef<Set<string>>(new Set());

  const handleVote = useCallback(async (id: string, voteType: "UP" | "DOWN") => {
    if (inflightRef.current.has(id)) return;
    inflightRef.current.add(id);

    let snapshot: FeedbackWithMeta | undefined;

    setFeedback((prev) =>
      prev.map((f) => {
        if (f.id !== id) return f;
        snapshot = { ...f };
        return {
          ...f,
          upvotes: (f.upvotes ?? 0) + (voteType === "UP" ? 1 : 0),
          downvotes: (f.downvotes ?? 0) + (voteType === "DOWN" ? 1 : 0),
        };
      })
    );

    try {
      const res = await fetch(`/api/feedback/${id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: getSessionId(), voteType }),
      });
      if (!res.ok) throw new Error(`Vote failed: ${res.status}`);
      const data = await res.json();
      setFeedback((prev) =>
        prev.map((f) =>
          f.id === id
            ? { ...f, upvotes: data.upvotes ?? f.upvotes, downvotes: data.downvotes ?? f.downvotes ?? 0 }
            : f
        )
      );
    } catch {
      if (snapshot) {
        const rollback = snapshot;
        setFeedback((prev) => prev.map((f) => (f.id === id ? rollback : f)));
      }
    } finally {
      inflightRef.current.delete(id);
    }
  }, []);

  const handleQuestionVote = useCallback(async (id: string, voteType: "UP" | "DOWN") => {
    if (inflightRef.current.has(id)) return;
    inflightRef.current.add(id);

    let snapshot: CampaignQuestionItem | undefined;

    setCampaignQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== id) return q;
        snapshot = { ...q };
        return {
          ...q,
          upvotes: (q.upvotes ?? 0) + (voteType === "UP" ? 1 : 0),
          downvotes: (q.downvotes ?? 0) + (voteType === "DOWN" ? 1 : 0),
        };
      })
    );

    try {
      const res = await fetch(`/api/questions/${id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: getSessionId(), voteType }),
      });
      if (!res.ok) throw new Error(`Vote failed: ${res.status}`);
      const data = await res.json();
      setCampaignQuestions((prev) =>
        prev.map((q) =>
          q.id === id
            ? { ...q, upvotes: data.upvotes ?? q.upvotes, downvotes: data.downvotes ?? q.downvotes ?? 0 }
            : q
        )
      );
    } catch {
      if (snapshot) {
        const rollback = snapshot;
        setCampaignQuestions((prev) => prev.map((q) => (q.id === id ? rollback : q)));
      }
    } finally {
      inflightRef.current.delete(id);
    }
  }, []);

  /* ---- Build & filter feed items ---- */

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
                      <VoteButtons
                        upvotes={item.data.upvotes}
                        downvotes={item.data.downvotes}
                        onVote={(voteType) => handleVote(item.data.id, voteType)}
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
                  onVote={(voteType) => handleQuestionVote(item.data.id, voteType)}
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

/* ------------------------------------------------------------------ */
/*  Campaign question card (unchanged)                                 */
/* ------------------------------------------------------------------ */

type CampaignQuestionItem = {
  id: string;
  campaignTitle: string;
  campaignDescription: string | null;
  category: FeedbackCategory;
  prompt: string;
  createdAt: Date;
  responsesCount: number;
  upvotes: number;
  downvotes: number;
};

type FeedItem =
  | { kind: "feedback"; data: FeedbackWithMeta }
  | { kind: "question"; data: CampaignQuestionItem };

function CampaignQuestionCard({
  question,
  onVote,
  threadSlot,
}: {
  question: CampaignQuestionItem;
  onVote: (voteType: "UP" | "DOWN") => void;
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
            <Badge variant="pending">Feedback</Badge>
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
        <VoteButtons
          upvotes={question.upvotes ?? 0}
          downvotes={question.downvotes ?? 0}
          onVote={onVote}
        />
      </CardFooter>
      <CardContent>{threadSlot}</CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Vote buttons                                                       */
/* ------------------------------------------------------------------ */

interface VoteButtonsProps {
  upvotes: number;
  downvotes: number;
  onVote: (voteType: "UP" | "DOWN") => void;
}

function VoteButtons({ upvotes, downvotes, onVote }: VoteButtonsProps) {
  const up = upvotes ?? 0;
  const down = downvotes ?? 0;

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={() => onVote("UP")}
        className="flex cursor-pointer items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/10 hover:text-primary active:bg-primary active:text-primary-foreground"
        aria-label="Upvote"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
          <path fillRule="evenodd" d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z" clipRule="evenodd" />
        </svg>
        <span className="tabular-nums">{up}</span>
      </button>

      <button
        onClick={() => onVote("DOWN")}
        className="flex cursor-pointer items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/10 hover:text-primary active:bg-primary active:text-primary-foreground"
        aria-label="Downvote"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
          <path fillRule="evenodd" d="M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.158V3.75A.75.75 0 0110 3z" clipRule="evenodd" />
        </svg>
        <span className="tabular-nums">{down}</span>
      </button>
    </div>
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
