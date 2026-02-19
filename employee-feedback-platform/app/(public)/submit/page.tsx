"use client";

import { useEffect, useMemo, useState } from "react";
import { getSessionId } from "@/components/feedback/session";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

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

const CATEGORY_TABS: { value: Category | "ALL"; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "CULTURE", label: "Culture" },
  { value: "TOOLS", label: "Tools" },
  { value: "WORKLOAD", label: "Workload" },
  { value: "MANAGEMENT", label: "Management" },
  { value: "OTHER", label: "Other" },
];

const CATEGORY_LABELS: Record<Category, string> = {
  CULTURE: "Culture",
  TOOLS: "Tools",
  WORKLOAD: "Workload",
  MANAGEMENT: "Management",
  OTHER: "Other",
};

export default function SubmitPage() {
  const [data, setData] = useState<CampaignResponse>({ campaigns: [] });
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<Category | "ALL">("ALL");
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
    <section className="space-y-7">
      <div className="space-y-2 rounded-xl border border-slate-200 bg-white px-5 py-6 sm:px-6">
        <h1 className="text-2xl font-semibold text-slate-900">Answer admin questions</h1>
        <p className="text-sm text-slate-600">
          Browse campaigns by category and respond to the questions that matter to you.
        </p>
      </div>

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

      {loading ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          Loading campaigns…
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          No campaigns in this category right now.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCampaigns.map((campaign) => (
            <div key={campaign.id} className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge>{CATEGORY_LABELS[campaign.category]}</Badge>
                <p className="text-xs text-slate-400">Campaign</p>
              </div>
              <h2 className="mt-2 text-lg font-semibold text-slate-900">{campaign.title}</h2>
              {campaign.description && (
                <p className="mt-1 text-sm text-slate-600">{campaign.description}</p>
              )}

              <div className="mt-4 space-y-3">
                {campaign.questions.map((q) => (
                  <div key={q.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-medium text-slate-900">{q.prompt}</p>
                    {q.hasResponded ? (
                      <p className="mt-2 text-xs text-emerald-600">Response submitted.</p>
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

      {error && <p className="text-sm text-red-600">{error}</p>}
    </section>
  );
}
