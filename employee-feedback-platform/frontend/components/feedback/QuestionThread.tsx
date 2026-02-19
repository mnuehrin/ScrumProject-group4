"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getSessionId } from "@/components/feedback/session";

type QuestionResponse = {
  id: string;
  questionId: string;
  content: string;
  createdAt: string;
  authorLabel: string;
};

interface QuestionThreadProps {
  questionId: string;
  initialCount: number;
  onResponded?: () => void;
}

function formatDate(d: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(d));
}

export function QuestionThread({ questionId, initialCount, onResponded }: QuestionThreadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [responses, setResponses] = useState<QuestionResponse[]>([]);
  const [composerOpen, setComposerOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const responseCount = responses.length || initialCount;

  async function loadResponses() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/questions/${questionId}/responses`);
      if (!res.ok) throw new Error("Failed to load responses.");
      const data = await res.json();
      setResponses(Array.isArray(data) ? data : []);
    } catch {
      setError("Unable to load responses.");
    } finally {
      setLoading(false);
    }
  }

  async function toggleOpen() {
    const next = !isOpen;
    setIsOpen(next);
    if (!next) {
      setComposerOpen(false);
    }
    if (next && responses.length === 0 && !loading) {
      await loadResponses();
    }
  }

  async function submitResponse() {
    const content = draft.trim();
    if (content.length < 2) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/questions/${questionId}/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: getSessionId(), content }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Unable to submit response.");
        return;
      }
      setResponses((prev) => [
        ...prev,
        {
          id: data.id,
          questionId: data.questionId,
          content: data.content,
          createdAt: data.createdAt,
          authorLabel: `Anon-${getSessionId().slice(-4).toUpperCase()}`,
        },
      ]);
      setDraft("");
      setComposerOpen(false);
      onResponded?.();
    } catch {
      setError("Unable to submit response.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full space-y-3">
      <button
        type="button"
        onClick={toggleOpen}
        className="text-xs font-medium text-slate-600 hover:text-slate-900"
      >
        {isOpen ? "Hide discussion" : `Join discussion (${responseCount})`}
      </button>

      {isOpen && (
        <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <button
            type="button"
            onClick={() => setComposerOpen((prev) => !prev)}
            className="text-xs font-medium text-slate-600 hover:text-slate-900"
          >
            {composerOpen ? "Close comment box" : "Write a comment"}
          </button>

          {composerOpen && (
            <div className="space-y-2 rounded-md border border-slate-200 bg-white p-2.5">
              <Textarea
                rows={3}
                placeholder="What are your thoughts?"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
              <div className="flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  onClick={submitResponse}
                  disabled={submitting || draft.trim().length < 2}
                >
                  {submitting ? "Posting..." : "Comment"}
                </Button>
              </div>
            </div>
          )}

          {loading ? (
            <p className="text-xs text-slate-500">Loading discussion...</p>
          ) : responses.length === 0 ? (
            <p className="text-xs text-slate-500">No responses yet.</p>
          ) : (
            <ul className="space-y-3">
              {responses.map((response) => (
                <li key={response.id} className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="text-[11px] text-slate-500">
                    {response.authorLabel} · {formatDate(response.createdAt)}
                  </div>
                  <p className="mt-1 text-sm text-slate-800 whitespace-pre-wrap">
                    {response.content}
                  </p>
                </li>
              ))}
            </ul>
          )}

          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      )}
    </div>
  );
}
