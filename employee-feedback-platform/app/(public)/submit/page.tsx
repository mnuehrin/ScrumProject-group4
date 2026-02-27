"use client";

import { useEffect, useMemo, useState } from "react";
import { getSessionId } from "@/components/feedback/session";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CategoryPills, type CategoryValue } from "@/components/ui/category-pills";
import { Textarea } from "@/components/ui/textarea";
import { FeedbackForm } from "@/components/feedback/FeedbackForm";
import { cn } from "@/lib/utils";

type Category = "CULTURE" | "TOOLS" | "WORKLOAD" | "MANAGEMENT" | "OTHER";

type QuestionItem = {
  id: string;
  prompt: string;
  hasResponded?: boolean;
};

type CampaignItem = {
  id: string;
  title: string;
  description: string | null;
  category: Category;
  questions: QuestionItem[];
};

type CampaignResponse = {
  campaigns: CampaignItem[];
};

const CATEGORY_LABELS: Record<Category, string> = {
  CULTURE: "Culture",
  TOOLS: "Tools",
  WORKLOAD: "Workload",
  MANAGEMENT: "Management",
  OTHER: "Other",
};

type ActiveTab = "questions" | "feedback";

export default function SubmitPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("questions");
  const [data, setData] = useState<CampaignResponse>({ campaigns: [] });
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<CategoryValue>("ALL");
  const [openQuestions, setOpenQuestions] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function loadCampaigns() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/campaigns/active", {
          headers: { "x-session-id": getSessionId() },
        });
        const payload = await res.json();
        setData({ campaigns: Array.isArray(payload?.campaigns) ? payload.campaigns : [] });
      } catch {
        setError("Unable to load campaigns.");
      } finally {
        setLoading(false);
      }
    }

    loadCampaigns();
  }, []);

  async function submitResponse(questionId: string) {
    const content = (drafts[questionId] ?? "").trim();
    if (content.length < 2) return;

    setSubmittingId(questionId);
    setError(null);
    try {
      const res = await fetch(`/api/questions/${questionId}/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: getSessionId(), content }),
      });
      const payload = await res.json();
      if (!res.ok) {
        setError(payload?.error ?? "Unable to submit response.");
        return;
      }

      setData((prev) => ({
        campaigns: prev.campaigns.map((campaign) => ({
          ...campaign,
          questions: campaign.questions.map((q) =>
            q.id === questionId ? { ...q, hasResponded: true } : q
          ),
        })),
      }));
      setDrafts((prev) => ({ ...prev, [questionId]: "" }));
      setOpenQuestions((prev) => {
        const next = new Set(prev);
        next.delete(questionId);
        return next;
      });
    } catch {
      setError("Unable to submit response.");
    } finally {
      setSubmittingId(null);
    }
  }

  function toggleQuestion(questionId: string) {
    setOpenQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) {
        next.delete(questionId);
      } else {
        next.add(questionId);
      }
      return next;
    });
  }

  const filteredCampaigns = useMemo(() => {
    if (activeCategory === "ALL") return data.campaigns;
    return data.campaigns.filter((c) => c.category === activeCategory);
  }, [data.campaigns, activeCategory]);

  return (
    <section className="space-y-6">
      {/* Tab Toggle */}
      <div className="flex items-center gap-1 rounded-lg border border-border bg-accent/40 p-1 w-fit">
        <button
          onClick={() => setActiveTab("questions")}
          className={cn(
            "rounded-md px-4 py-2 text-sm font-medium transition-all",
            activeTab === "questions"
              ? "bg-card text-foreground shadow-sm ring-1 ring-border"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Answer Questions
        </button>
        <button
          onClick={() => setActiveTab("feedback")}
          className={cn(
            "rounded-md px-4 py-2 text-sm font-medium transition-all",
            activeTab === "feedback"
              ? "bg-card text-foreground shadow-sm ring-1 ring-border"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Submit Feedback
        </button>
      </div>

      {/* Answer Questions Tab */}
      {activeTab === "questions" && (
        <>
          <div className="space-y-1">
            <h1 className="sr-only">Answer admin questions</h1>
            <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
              Browse feedback by category and respond to the questions that matter to you.
            </p>
          </div>

          <CategoryPills active={activeCategory} onChange={setActiveCategory} />

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
              Loading feedback…
            </div>
          ) : filteredCampaigns.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
              No feedback in this category right now.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCampaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="rounded-2xl border border-border bg-card p-5 shadow-[0_12px_32px_-24px_rgba(15,23,42,0.3)]"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{CATEGORY_LABELS[campaign.category]}</Badge>
                    <p className="text-xs text-muted-foreground">Feedback</p>
                  </div>
                  <h2 className="mt-2 text-lg font-semibold text-foreground">{campaign.title}</h2>
                  {campaign.description && (
                    <p className="mt-1 text-sm text-muted-foreground">{campaign.description}</p>
                  )}

                  <div className="mt-4 space-y-3">
                    {campaign.questions.map((q) => (
                      <div
                        key={q.id}
                        className="rounded-xl border border-border bg-accent/40 p-4"
                      >
                        <p className="text-sm font-medium text-foreground">{q.prompt}</p>
                        {q.hasResponded ? (
                          <p className="mt-2 text-xs text-emerald-500">Response submitted.</p>
                        ) : (
                          <div className="mt-3 space-y-2">
                            {!openQuestions.has(q.id) ? (
                              <Button size="sm" variant="secondary" onClick={() => toggleQuestion(q.id)}>
                                Answer this question
                              </Button>
                            ) : (
                              <>
                                <Textarea
                                  rows={3}
                                  placeholder="Your response"
                                  value={drafts[q.id] ?? ""}
                                  onChange={(e) =>
                                    setDrafts((prev) => ({ ...prev, [q.id]: e.target.value }))
                                  }
                                />
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => toggleQuestion(q.id)}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => submitResponse(q.id)}
                                    disabled={
                                      submittingId === q.id ||
                                      (drafts[q.id] ?? "").trim().length < 2
                                    }
                                  >
                                    {submittingId === q.id ? "Submitting..." : "Submit"}
                                  </Button>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Submit Feedback Tab */}
      {activeTab === "feedback" && (
        <div className="mx-auto w-full max-w-2xl space-y-4">
          <div className="space-y-1">
            <h1 className="text-xl font-semibold">Submit feedback</h1>
            <p className="text-sm text-muted-foreground">
              Your submission is anonymous. Be specific so it&apos;s actionable.
            </p>
          </div>
          <FeedbackForm />
        </div>
      )}
    </section>
  );
}
