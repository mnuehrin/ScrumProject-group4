"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

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
  const [showCreateForm, setShowCreateForm] = useState(false);
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
      setShowCreateForm(false);
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
      <div className="flex min-h-[400px] items-center justify-center rounded-xl border border-dashed border-border bg-card p-10 text-sm text-muted-foreground">
        Loading posts…
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-6xl space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between py-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Post Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create sets of questions and curate feedback gathering campaigns.
          </p>
        </div>
        <Button 
          onClick={() => setShowCreateForm(!showCreateForm)}
          variant={showCreateForm ? "secondary" : "default"}
          className="shrink-0"
        >
          {showCreateForm ? "Cancel Creation" : "+ Create New Post"}
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-500">
          {error}
        </div>
      )}

      {/* Slide-down Create Form */}
      {showCreateForm && (
        <div className="animate-in slide-in-from-top-4 fade-in duration-300 rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-foreground">Create a New Post</h2>
            <p className="text-sm text-muted-foreground">Setup the foundation for your new question campaign.</p>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Post Title
                </label>
                <input
                  autoFocus
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., Q3 Culture Check-in"
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as Campaign["category"])}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
                >
                  {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="space-y-1.5 flex flex-col">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Description (Optional)
              </label>
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Give employees some context on what this post aims to achieve..."
                className="w-full flex-1 min-h-[100px] resize-none rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
              />
            </div>
          </div>
          
          <div className="mt-6 flex justify-end gap-3 border-t border-border pt-4">
            <Button variant="ghost" onClick={() => setShowCreateForm(false)}>
              Cancel
            </Button>
            <Button onClick={createCampaign} disabled={creating || newTitle.trim().length < 3}>
              {creating ? "Creating..." : "Save Post"}
            </Button>
          </div>
        </div>
      )}

      {/* Main Layout: Sidebar + Detail */}
      <div className="flex flex-col gap-6 lg:flex-row">
        
        {/* Modern Sidebar for Posts */}
        <div className="flex flex-col gap-1 lg:w-72 shrink-0">
          <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            All Posts ({campaigns.length})
          </p>
          
          {campaigns.length === 0 ? (
            <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
              No posts found. Create one to get started.
            </div>
          ) : (
            <div className="flex flex-col gap-1 overflow-y-auto max-h-[600px] pr-1 pb-4">
              {campaigns.map((c) => {
                const isSelected = selectedCampaignId === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                        setSelectedCampaignId(c.id);
                        setShowCreateForm(false);
                    }}
                    className={`group flex w-full flex-col items-start gap-1.5 rounded-lg px-4 py-3 text-left transition-colors border ${
                      isSelected 
                        ? "border-border bg-accent text-accent-foreground" 
                        : "border-transparent hover:bg-accent/50"
                    }`}
                  >
                    <div className="flex w-full items-center justify-between gap-2">
                        <span className={`truncate text-sm font-medium ${isSelected ? "text-foreground" : "text-muted-foreground"}`}>
                            {c.title}
                        </span>
                        {/* Dot indicator for status */}
                        <span 
                            title={STATUS_LABELS[c.status]}
                            className={`h-2 w-2 shrink-0 rounded-full ${
                                c.status === "LIVE" ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" : 
                                c.status === "DRAFT" ? "bg-amber-500" : 
                                "bg-zinc-500"
                            }`} 
                        />
                    </div>
                    <div className="flex w-full items-center justify-between text-[11px] text-muted-foreground">
                        <span>{CATEGORY_LABELS[c.category]}</span>
                        <span>{c.questions?.length ?? 0} {c.questions?.length === 1 ? 'Ques' : 'Ques'}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Detail Pane */}
        <div className="flex-1 min-w-0">
          {selectedCampaign ? (
            <div className="flex flex-col gap-6 rounded-xl border border-border bg-card p-6 shadow-sm min-h-[600px]">
              
              {/* Detail Header */}
              <div className="flex flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold tracking-tight text-foreground">{selectedCampaign.title}</h2>
                    <Badge variant="secondary" className="bg-accent/50 hover:bg-accent/50 text-xs">
                        {CATEGORY_LABELS[selectedCampaign.category]}
                    </Badge>
                  </div>
                  {selectedCampaign.description ? (
                    <p className="text-sm leading-relaxed text-muted-foreground">{selectedCampaign.description}</p>
                  ) : (
                    <p className="text-sm italic text-muted-foreground/50">No description provided.</p>
                  )}
                </div>
                
                {/* Segmented Control for Status */}
                <div className="shrink-0 flex items-center rounded-lg bg-accent/40 p-1 border border-border/50">
                  {(["DRAFT", "LIVE", "ARCHIVED"] as Campaign["status"][]).map((status) => {
                    const isActive = selectedCampaign.status === status;
                    return (
                        <button
                        key={status}
                        onClick={() => updateStatus(selectedCampaign.id, status)}
                        className={`relative rounded-md px-3.5 py-1.5 text-xs font-medium transition-all duration-200 ${
                            isActive 
                            ? "bg-background text-foreground shadow-sm ring-1 ring-border/50" 
                            : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                        }`}
                        >
                        {STATUS_LABELS[status]}
                        </button>
                    );
                  })}
                </div>
              </div>

              {/* Questions Area */}
              <div className="flex-1 space-y-5">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-foreground">Questions ({selectedCampaign.questions.length})</h3>
                </div>

                {/* "Chat Style" Question Input */}
                <div className="relative rounded-xl border border-border bg-background focus-within:ring-2 focus-within:ring-ring/20 focus-within:border-ring transition-all overflow-hidden shadow-sm">
                    <Textarea
                        value={questionDraft}
                        onChange={(e) => setQuestionDraft(e.target.value)}
                        placeholder="Type a new question here..."
                        className="min-h-[80px] w-full resize-none border-0 bg-transparent px-4 py-3 pb-12 text-sm text-foreground focus-visible:ring-0 placeholder:text-muted-foreground/60"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                addQuestion();
                            }
                        }}
                    />
                    <div className="absolute bottom-2 right-2 flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground hidden sm:inline-block pointer-events-none mr-1">
                            Press Enter
                        </span>
                        <Button
                            size="sm"
                            className="h-8 rounded-lg px-4 text-xs font-semibold"
                            onClick={addQuestion}
                            disabled={savingQuestion || questionDraft.trim().length < 3}
                        >
                            {savingQuestion ? "Adding..." : "Add"}
                        </Button>
                    </div>
                </div>

                {/* Question List */}
                <div className="space-y-3 pt-2">
                  {selectedCampaign.questions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-12 text-center">
                        <div className="rounded-full bg-accent/50 p-3 mb-3">
                            <svg className="h-6 w-6 text-muted-foreground/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <p className="text-sm font-medium text-foreground">No questions added yet</p>
                        <p className="text-xs text-muted-foreground mt-1 max-w-xs">Start writing questions above to build out this feedback campaign.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                        {selectedCampaign.questions.map((q, index) => (
                            <div key={q.id} className="group relative flex items-start gap-4 rounded-xl border border-border/60 bg-accent/20 p-4 transition-colors hover:bg-accent/40">
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-background border border-border text-xs font-medium text-muted-foreground group-hover:bg-foreground group-hover:text-background group-hover:border-transparent transition-colors">
                                    {index + 1}
                                </div>
                                <div className="flex-1 space-y-1 pt-0.5">
                                    <p className="text-sm font-medium leading-relaxed text-foreground">{q.prompt}</p>
                                    <div className="flex items-center gap-3 pt-1">
                                        <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                            </svg>
                                            {q.responsesCount ?? 0} {q.responsesCount === 1 ? 'Response' : 'Responses'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>

            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Select a post to manage questions.</p>
          )}
        </div>
      </div>

    </section>
  );
}
