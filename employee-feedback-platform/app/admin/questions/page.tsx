"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Question = {
  id: string;
  prompt: string;
  order: number;
  responsesCount?: number;
};

type Campaign = {
  id: string;
  title: string;
  description: string | null;
  category: "CULTURE" | "TOOLS" | "WORKLOAD" | "MANAGEMENT" | "OTHER";
  status: "DRAFT" | "LIVE" | "ARCHIVED";
  startsAt: string | null;
  endsAt: string | null;
  questions: Question[];
};

const STATUS_LABELS: Record<Campaign["status"], string> = {
  DRAFT: "Draft",
  LIVE: "Live",
  ARCHIVED: "Archived",
};

const CATEGORY_LABELS: Record<Campaign["category"], string> = {
  CULTURE: "Culture",
  TOOLS: "Tools",
  WORKLOAD: "Workload",
  MANAGEMENT: "Management",
  OTHER: "Other",
};

export default function AdminQuestionsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newCategory, setNewCategory] = useState<Campaign["category"]>("CULTURE");
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [questionDraft, setQuestionDraft] = useState("");
  const [savingQuestion, setSavingQuestion] = useState(false);

  const selectedCampaign = useMemo(
    () => campaigns.find((c) => c.id === selectedCampaignId) ?? null,
    [campaigns, selectedCampaignId]
  );

  useEffect(() => {
    async function loadCampaigns() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/admin/campaigns");
        const data = await res.json();
        setCampaigns(Array.isArray(data) ? data : []);
        if (!selectedCampaignId && Array.isArray(data) && data.length > 0) {
          setSelectedCampaignId(data[0].id);
        }
      } catch {
        setError("Unable to load campaigns.");
      } finally {
        setLoading(false);
      }
    }

    loadCampaigns();
  }, [selectedCampaignId]);

  async function createCampaign() {
    if (newTitle.trim().length < 3) return;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          description: newDescription || undefined,
          category: newCategory,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Unable to create campaign.");
        return;
      }
      setCampaigns((prev) => [
        {
          ...data,
          questions: Array.isArray(data?.questions) ? data.questions : [],
        },
        ...prev,
      ]);
      setSelectedCampaignId(data.id);
      setNewTitle("");
      setNewDescription("");
      setNewCategory("CULTURE");
    } catch {
      setError("Unable to create campaign.");
    } finally {
      setCreating(false);
    }
  }

  async function updateStatus(campaignId: string, status: Campaign["status"]) {
    setError(null);
    try {
      const res = await fetch(`/api/admin/campaigns/${campaignId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Unable to update status.");
        return;
      }
      setCampaigns((prev) =>
        prev.map((c) => (c.id === campaignId ? { ...c, status: data.status } : c))
      );
    } catch {
      setError("Unable to update status.");
    }
  }

  async function addQuestion() {
    if (!selectedCampaign || questionDraft.trim().length < 3) return;
    setSavingQuestion(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/campaigns/${selectedCampaign.id}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: questionDraft }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Unable to add question.");
        return;
      }
      setCampaigns((prev) =>
        prev.map((c) =>
          c.id === selectedCampaign.id
            ? { ...c, questions: [...c.questions, data] }
            : c
        )
      );
      setQuestionDraft("");
    } catch {
      setError("Unable to add question.");
    } finally {
      setSavingQuestion(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
        Loading question campaigns…
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <div className="space-y-2 rounded-xl border border-border bg-card px-6 py-5">
        <h1 className="sr-only">Question campaigns</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Create and publish live questions for employees.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            New campaign
          </label>
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Campaign title"
            className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
          />
          <select
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value as Campaign["category"])}
            className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
          >
            {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <textarea
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="Optional description"
            rows={2}
            className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
          />
        </div>
        <Button size="sm" onClick={createCampaign} disabled={creating || newTitle.trim().length < 3}>
          {creating ? "Creating..." : "Create campaign"}
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Campaigns
          </p>
          {campaigns.length === 0 ? (
            <p className="text-sm text-muted-foreground">No campaigns yet.</p>
          ) : (
            <ul className="space-y-2">
              {campaigns.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedCampaignId(c.id)}
                    className={`w-full cursor-pointer rounded-lg border px-4 py-3 text-left text-sm transition-all ${
                      selectedCampaignId === c.id
                        ? "border-border bg-accent/60 text-foreground shadow-sm"
                        : "border-border bg-card text-muted-foreground hover:bg-accent/50 active:bg-accent/70"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{c.title}</span>
                      <Badge>{STATUS_LABELS[c.status]}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {CATEGORY_LABELS[c.category]} · {c.questions?.length ?? 0} questions
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          {selectedCampaign ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-foreground">{selectedCampaign.title}</h2>
                    <Badge>{CATEGORY_LABELS[selectedCampaign.category]}</Badge>
                  </div>
                  {selectedCampaign.description && (
                    <p className="text-sm text-muted-foreground">{selectedCampaign.description}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  {(["DRAFT", "LIVE", "ARCHIVED"] as Campaign["status"][]).map((status) => (
                    <Button
                      key={status}
                      size="sm"
                      variant={selectedCampaign.status === status ? "default" : "secondary"}
                      onClick={() => updateStatus(selectedCampaign.id, status)}
                    >
                      {STATUS_LABELS[status]}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-border bg-accent/40 p-4 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Add question
                </p>
                <textarea
                  value={questionDraft}
                  onChange={(e) => setQuestionDraft(e.target.value)}
                  placeholder="Write a question prompt..."
                  rows={3}
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
                />
                <Button
                  size="sm"
                  onClick={addQuestion}
                  disabled={savingQuestion || questionDraft.trim().length < 3}
                >
                  {savingQuestion ? "Saving..." : "Add question"}
                </Button>
              </div>

              <div className="space-y-3">
                {selectedCampaign.questions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No questions yet.</p>
                ) : (
                  selectedCampaign.questions.map((q) => (
                    <div key={q.id} className="rounded-lg border border-border bg-card p-4">
                      <p className="text-sm font-medium text-foreground">{q.prompt}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Order {q.order} · {q.responsesCount ?? 0} responses
                      </p>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Select a campaign to manage questions.</p>
          )}
        </div>
      </div>

    </section>
  );
}
