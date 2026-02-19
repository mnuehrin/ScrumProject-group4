"use client";

import { useEffect, useState } from "react";
import { getSessionId } from "@/components/feedback/session";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

type QuestionItem = {
  id: string;
  prompt: string;
  hasResponded?: boolean;
};

type CampaignResponse = {
  campaign: {
    id: string;
    title: string;
    description: string | null;
    status: string;
    startsAt: string | null;
    endsAt: string | null;
  } | null;
  questions: QuestionItem[];
};

export default function QuestionsPage() {
  const [data, setData] = useState<CampaignResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadActive() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/campaigns/active", {
          headers: { "x-session-id": getSessionId() },
        });
        const payload = await res.json();
        setData(payload);
      } catch {
        setError("Unable to load live questions.");
      } finally {
        setLoading(false);
      }
    }

    loadActive();
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

      setData((prev) =>
        prev
          ? {
              ...prev,
              questions: prev.questions.map((q) =>
                q.id === questionId ? { ...q, hasResponded: true } : q
              ),
            }
          : prev
      );
      setDrafts((prev) => ({ ...prev, [questionId]: "" }));
    } catch {
      setError("Unable to submit response.");
    } finally {
      setSubmittingId(null);
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
        Loading live questions…
      </div>
    );
  }

  if (!data?.campaign) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
        No live questions right now.
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white px-5 py-6 sm:px-6">
        <div className="flex items-center gap-2">
          <Badge>Live</Badge>
          <p className="text-xs text-slate-400">Campaign</p>
        </div>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">{data.campaign.title}</h1>
        {data.campaign.description && (
          <p className="mt-2 text-sm text-slate-600">{data.campaign.description}</p>
        )}
      </div>

      <div className="space-y-4">
        {data.questions.map((q) => (
          <div key={q.id} className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm font-medium text-slate-900">{q.prompt}</p>
            {q.hasResponded ? (
              <p className="mt-3 text-xs text-emerald-600">Response submitted.</p>
            ) : (
              <div className="mt-3 space-y-2">
                <Textarea
                  rows={3}
                  placeholder="Your response"
                  value={drafts[q.id] ?? ""}
                  onChange={(e) =>
                    setDrafts((prev) => ({ ...prev, [q.id]: e.target.value }))
                  }
                />
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    onClick={() => submitResponse(q.id)}
                    disabled={submittingId === q.id || (drafts[q.id] ?? "").trim().length < 2}
                  >
                    {submittingId === q.id ? "Submitting..." : "Submit"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </section>
  );
}
