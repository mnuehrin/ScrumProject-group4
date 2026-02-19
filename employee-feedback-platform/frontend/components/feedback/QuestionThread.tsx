"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getSessionId } from "@/components/feedback/session";

type QuestionResponse = {
  id: string;
  questionId: string;
  parentId?: string | null;
  content: string;
  createdAt: string;
  authorLabel: string;
};

type ThreadNode = QuestionResponse & { replies: ThreadNode[] };

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

function authorInitial(authorLabel: string) {
  return authorLabel.replace("Anon-", "").charAt(0).toUpperCase() || "A";
}

function threadScore(node: ThreadNode): number {
  if (node.replies.length === 0) return 0;
  return node.replies.length + node.replies.reduce((acc, reply) => acc + threadScore(reply), 0);
}

function sortNodes(nodes: ThreadNode[]): ThreadNode[] {
  const sorted = [...nodes];
  sorted.sort((a, b) => {
    const aScore = threadScore(a);
    const bScore = threadScore(b);
    if (aScore !== bScore) return bScore - aScore;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return sorted.map((node) => ({
    ...node,
    replies: sortNodes(node.replies),
  }));
}

function buildThread(comments: QuestionResponse[]): ThreadNode[] {
  const nodeMap = new Map<string, ThreadNode>();
  comments.forEach((comment) => {
    nodeMap.set(comment.id, { ...comment, replies: [] });
  });

  const roots: ThreadNode[] = [];
  comments.forEach((comment) => {
    const node = nodeMap.get(comment.id);
    if (!node) return;

    if (!comment.parentId) {
      roots.push(node);
      return;
    }

    const parent = nodeMap.get(comment.parentId);
    if (!parent) {
      roots.push(node);
      return;
    }
    parent.replies.push(node);
  });

  return sortNodes(roots);
}

export function QuestionThread({ questionId, initialCount, onResponded }: QuestionThreadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [responses, setResponses] = useState<QuestionResponse[]>([]);
  const [composerOpen, setComposerOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [expandedReplyIds, setExpandedReplyIds] = useState<Set<string>>(new Set());
  const [visibleReplyCounts, setVisibleReplyCounts] = useState<Record<string, number>>({});
  const [visibleRootCount, setVisibleRootCount] = useState(3);

  const thread = useMemo(() => buildThread(responses), [responses]);

  const responseCount = responses.length || initialCount;
  const directReplyCount = thread.length;
  const participantsCount = new Set(responses.map((response) => response.authorLabel)).size;
  const visibleRootComments = thread.slice(0, visibleRootCount);
  const hiddenRootComments = Math.max(0, thread.length - visibleRootComments.length);

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
      setReplyingTo(null);
      setVisibleRootCount(3);
    }
    if (next && responses.length === 0 && !loading) {
      await loadResponses();
    }
  }

  async function submitResponse(content: string, parentId?: string) {
    if (content.length < 2) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/questions/${questionId}/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: getSessionId(), content, parentId }),
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
          parentId: data.parentId ?? null,
          content: data.content,
          createdAt: data.createdAt,
          authorLabel: `Anon-${getSessionId().slice(-4).toUpperCase()}`,
        },
      ]);
      if (!parentId) {
        setDraft("");
        setComposerOpen(false);
      }
      if (parentId) {
        setReplyDrafts((prev) => ({ ...prev, [parentId]: "" }));
        setReplyingTo(null);
      }
      onResponded?.();
    } catch {
      setError("Unable to submit response.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleNewCommentSubmit() {
    const content = draft.trim();
    if (content.length < 2) return;
    await submitResponse(content);
  }

  async function handleReplySubmit(parentId: string) {
    const content = (replyDrafts[parentId] ?? "").trim();
    if (content.length < 2) return;
    await submitResponse(content, parentId);
  }

  function toggleReplies(commentId: string) {
    setExpandedReplyIds((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) next.delete(commentId);
      else next.add(commentId);
      return next;
    });

    setVisibleReplyCounts((prev) => {
      if (prev[commentId]) return prev;
      return { ...prev, [commentId]: 2 };
    });
  }

  function showMoreReplies(commentId: string, totalReplies: number) {
    setVisibleReplyCounts((prev) => {
      const current = prev[commentId] ?? 2;
      const next = Math.min(totalReplies, current + 2);
      return { ...prev, [commentId]: next };
    });
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
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setComposerOpen((prev) => !prev)}
              className="text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              {composerOpen ? "Close comment box" : "Write a comment"}
            </button>
          </div>

          <div className="text-[11px] text-slate-500">
            {directReplyCount} direct replies · {responses.length} total comments ·{" "}
            {participantsCount} participants
          </div>

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
                  onClick={handleNewCommentSubmit}
                  disabled={submitting || draft.trim().length < 2}
                >
                  {submitting ? "Posting..." : "Comment"}
                </Button>
              </div>
            </div>
          )}

          {loading ? (
            <p className="text-xs text-slate-500">Loading discussion...</p>
          ) : thread.length === 0 ? (
            <p className="text-xs text-slate-500">No responses yet.</p>
          ) : (
            <ul className="space-y-3">
              {visibleRootComments.map((comment) => (
                <ThreadItem
                  key={comment.id}
                  comment={comment}
                  level={0}
                  replyingTo={replyingTo}
                  replyDrafts={replyDrafts}
                  setReplyingTo={setReplyingTo}
                  setReplyDrafts={setReplyDrafts}
                  handleReplySubmit={handleReplySubmit}
                  submitting={submitting}
                  expandedReplyIds={expandedReplyIds}
                  toggleReplies={toggleReplies}
                  visibleReplyCounts={visibleReplyCounts}
                  showMoreReplies={showMoreReplies}
                />
              ))}
              {hiddenRootComments > 0 && (
                <li>
                  <button
                    type="button"
                    onClick={() =>
                      setVisibleRootCount((prev) => Math.min(thread.length, prev + 3))
                    }
                    className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900"
                  >
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-400 text-[13px] leading-none">
                      +
                    </span>
                    Show more comments ({hiddenRootComments})
                  </button>
                </li>
              )}
            </ul>
          )}

          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      )}
    </div>
  );
}

function ThreadItem({
  comment,
  level,
  replyingTo,
  replyDrafts,
  setReplyingTo,
  setReplyDrafts,
  handleReplySubmit,
  submitting,
  expandedReplyIds,
  toggleReplies,
  visibleReplyCounts,
  showMoreReplies,
}: {
  comment: ThreadNode;
  level: number;
  replyingTo: string | null;
  replyDrafts: Record<string, string>;
  setReplyingTo: (id: string | null) => void;
  setReplyDrafts: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  handleReplySubmit: (parentId: string) => Promise<void>;
  submitting: boolean;
  expandedReplyIds: Set<string>;
  toggleReplies: (commentId: string) => void;
  visibleReplyCounts: Record<string, number>;
  showMoreReplies: (commentId: string, totalReplies: number) => void;
}) {
  const showReply = replyingTo === comment.id;
  const hasReplies = comment.replies.length > 0;
  const repliesExpanded = expandedReplyIds.has(comment.id);
  const visibleCount = visibleReplyCounts[comment.id] ?? 2;
  const visibleReplies = repliesExpanded ? comment.replies.slice(0, visibleCount) : [];
  const remainingReplies = repliesExpanded ? comment.replies.length - visibleReplies.length : 0;

  return (
    <li className="relative">
      {level > 0 && (
        <span className="absolute -left-7 top-1 h-5 w-7 rounded-bl-xl border-b border-l border-slate-300/80" />
      )}
      <div className="flex gap-3 py-1">
        <div className="relative w-8 shrink-0">
          <div className="grid h-8 w-8 place-items-center rounded-full bg-slate-200 text-[11px] font-semibold text-slate-700">
            {authorInitial(comment.authorLabel)}
          </div>
          {hasReplies && repliesExpanded && (
            <span className="absolute left-4 top-[2.2rem] -bottom-1 w-px bg-slate-300/80" />
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <span className="font-medium text-slate-700">{comment.authorLabel}</span>
            <span>{formatDate(comment.createdAt)}</span>
          </div>

          <p className="whitespace-pre-wrap text-sm text-slate-800">{comment.content}</p>

          <div className="flex items-center gap-3 text-xs text-slate-500">
            <button type="button" className="font-semibold hover:text-slate-900">
              ↑
            </button>
            <button type="button" className="font-semibold hover:text-slate-900">
              ↓
            </button>
            <button
              type="button"
              onClick={() => setReplyingTo(showReply ? null : comment.id)}
              className="font-semibold hover:text-slate-900"
            >
              {showReply ? "Cancel" : "Reply"}
            </button>
            {hasReplies && repliesExpanded && (
              <button
                type="button"
                onClick={() => toggleReplies(comment.id)}
                className="font-semibold hover:text-slate-900"
              >
                Hide replies
              </button>
            )}
          </div>

          {showReply && (
            <div className="space-y-2 pt-1">
              <Textarea
                rows={2}
                value={replyDrafts[comment.id] ?? ""}
                onChange={(e) =>
                  setReplyDrafts((prev) => ({ ...prev, [comment.id]: e.target.value }))
                }
                placeholder="Write a reply..."
              />
              <div className="flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => void handleReplySubmit(comment.id)}
                  disabled={submitting || (replyDrafts[comment.id] ?? "").trim().length < 2}
                >
                  {submitting ? "Posting..." : "Reply"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {hasReplies && !repliesExpanded && (
        <div className="ml-11 mt-1">
          <button
            type="button"
            onClick={() => toggleReplies(comment.id)}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900"
          >
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-400 text-[13px] leading-none">
              +
            </span>
            {`${comment.replies.length} more repl${comment.replies.length === 1 ? "y" : "ies"}`}
          </button>
        </div>
      )}

      {hasReplies && repliesExpanded && (
        <ul className="relative mt-0.5 ml-4 pl-7 space-y-2">
          <span className="pointer-events-none absolute left-0 -top-3 bottom-3 w-px bg-slate-300/80" />
          {visibleReplies.map((reply) => (
            <ThreadItem
              key={reply.id}
              comment={reply}
              level={level + 1}
              replyingTo={replyingTo}
              replyDrafts={replyDrafts}
              setReplyingTo={setReplyingTo}
              setReplyDrafts={setReplyDrafts}
              handleReplySubmit={handleReplySubmit}
              submitting={submitting}
              expandedReplyIds={expandedReplyIds}
              toggleReplies={toggleReplies}
              visibleReplyCounts={visibleReplyCounts}
              showMoreReplies={showMoreReplies}
            />
          ))}
          {remainingReplies > 0 && (
            <li>
              <button
                type="button"
                onClick={() => showMoreReplies(comment.id, comment.replies.length)}
                className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900"
              >
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-400 text-[13px] leading-none">
                  +
                </span>
                Show more replies ({remainingReplies})
              </button>
            </li>
          )}
        </ul>
      )}
    </li>
  );
}
