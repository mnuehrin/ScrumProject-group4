"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { EmojiReactionPicker } from "@/components/feedback/EmojiReactionPicker";
import { getSessionId } from "@/components/feedback/session";
import type { ThreadComment } from "@/types";

type CommentSort = "best" | "new" | "old";

type ThreadNode = ThreadComment & {
  replies: ThreadNode[];
};

interface FeedbackThreadProps {
  feedbackId: string;
  initialCount: number;
}

const MAX_REPLY_DEPTH = 6;
const INITIAL_VISIBLE_REPLIES = 2;
const INITIAL_VISIBLE_ROOT_COMMENTS = 3;

function formatDate(d: Date) {
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

function sortNodes(nodes: ThreadNode[], sort: CommentSort): ThreadNode[] {
  const sorted = [...nodes];
  sorted.sort((a, b) => {
    if (sort === "new") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sort === "old") {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }

    const aOp = a.isOriginalPoster ? 1 : 0;
    const bOp = b.isOriginalPoster ? 1 : 0;
    if (aOp !== bOp) return bOp - aOp;

    const aScore = threadScore(a);
    const bScore = threadScore(b);
    if (aScore !== bScore) return bScore - aScore;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return sorted.map((node) => ({
    ...node,
    replies: sortNodes(node.replies, sort),
  }));
}

function buildThread(comments: ThreadComment[], sort: CommentSort): ThreadNode[] {
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

  return sortNodes(roots, sort);
}

export function FeedbackThread({ feedbackId, initialCount }: FeedbackThreadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [sort, setSort] = useState<CommentSort>("best");
  const [loading, setLoading] = useState(false);
  const [comments, setComments] = useState<ThreadComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [composerOpen, setComposerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [expandedReplyIds, setExpandedReplyIds] = useState<Set<string>>(new Set());
  const [visibleReplyCounts, setVisibleReplyCounts] = useState<Record<string, number>>({});
  const [visibleRootCount, setVisibleRootCount] = useState(INITIAL_VISIBLE_ROOT_COMMENTS);
  const [reactionPickerFor, setReactionPickerFor] = useState<string | null>(null);
  const [reactionsByComment, setReactionsByComment] = useState<
    Record<string, Record<string, number>>
  >({});

  const thread = useMemo(() => buildThread(comments, sort), [comments, sort]);

  async function loadComments() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/feedback/${feedbackId}/comments`);
      if (!res.ok) throw new Error("Failed to load comments.");
      const data = await res.json();
      setComments(Array.isArray(data) ? data : []);
    } catch {
      setError("Unable to load discussion.");
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
      setVisibleRootCount(INITIAL_VISIBLE_ROOT_COMMENTS);
      setReactionPickerFor(null);
    }
    if (next && comments.length === 0 && !loading) {
      await loadComments();
    }
  }

  async function submitComment(content: string, parentId?: string) {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/feedback/${feedbackId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: getSessionId(),
          content,
          parentId,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Unable to post comment.");
        return;
      }
      setComments((prev) => [...prev, data]);
    } catch {
      setError("Unable to post comment.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleNewCommentSubmit() {
    const content = newComment.trim();
    if (content.length < 2) return;
    await submitComment(content);
    setNewComment("");
    setComposerOpen(false);
  }

  async function handleReplySubmit(parentId: string) {
    const content = (replyDrafts[parentId] ?? "").trim();
    if (content.length < 2) return;
    await submitComment(content, parentId);
    setReplyDrafts((prev) => ({ ...prev, [parentId]: "" }));
    setReplyingTo(null);
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
      return { ...prev, [commentId]: INITIAL_VISIBLE_REPLIES };
    });
  }

  function showMoreReplies(commentId: string, totalReplies: number) {
    setVisibleReplyCounts((prev) => {
      const current = prev[commentId] ?? INITIAL_VISIBLE_REPLIES;
      const next = Math.min(totalReplies, current + INITIAL_VISIBLE_REPLIES);
      return { ...prev, [commentId]: next };
    });
  }

  function addReaction(commentId: string, emoji: string) {
    setReactionsByComment((prev) => {
      const current = prev[commentId] ?? {};
      return {
        ...prev,
        [commentId]: {
          ...current,
          [emoji]: (current[emoji] ?? 0) + 1,
        },
      };
    });
    setReactionPickerFor(null);
  }

  const discussionCount = comments.length || initialCount;
  const directReplyCount = thread.length;
  const participantsCount = new Set(comments.map((comment) => comment.authorLabel)).size;
  const visibleRootComments = thread.slice(0, visibleRootCount);
  const hiddenRootComments = Math.max(0, thread.length - visibleRootComments.length);

  return (
    <div className="w-full space-y-3">
      <button
        type="button"
        onClick={toggleOpen}
        className="cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/70 hover:text-foreground"
      >
        {isOpen ? "Hide discussion" : `Join discussion (${discussionCount})`}
      </button>

      {isOpen && (
        <div className="space-y-4 rounded-lg border border-border bg-muted/40 p-4 dark:bg-muted/20">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setComposerOpen((prev) => !prev)}
              className="cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/70 hover:text-foreground"
            >
              {composerOpen ? "Close comment box" : "Write a comment"}
            </button>
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground">Sort</label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as CommentSort)}
                className="cursor-pointer rounded-md border border-border bg-card px-3 py-1.5 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
              >
                <option value="best">Best</option>
                <option value="new">New</option>
                <option value="old">Old</option>
              </select>
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            {directReplyCount} direct replies · {comments.length} total comments · {participantsCount} participants
          </div>

          {composerOpen && (
            <div className="space-y-3 rounded-lg border border-border bg-card p-3">
              <Textarea
                rows={3}
                placeholder="What are your thoughts?"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <div className="flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleNewCommentSubmit}
                  disabled={submitting || newComment.trim().length < 2}
                >
                  {submitting ? "Posting..." : "Comment"}
                </Button>
              </div>
            </div>
          )}

          {loading ? (
            <p className="text-xs text-muted-foreground">Loading discussion...</p>
          ) : thread.length === 0 ? (
            <p className="text-xs text-muted-foreground">No comments yet.</p>
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
                  reactionPickerFor={reactionPickerFor}
                  setReactionPickerFor={setReactionPickerFor}
                  reactionsByComment={reactionsByComment}
                  addReaction={addReaction}
                />
              ))}
              {hiddenRootComments > 0 && (
                <li>
                  <button
                    type="button"
                    onClick={() =>
                      setVisibleRootCount((prev) =>
                        Math.min(thread.length, prev + INITIAL_VISIBLE_ROOT_COMMENTS)
                      )
                    }
                    className="inline-flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-accent/70 hover:text-foreground"
                  >
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-border text-sm leading-none text-foreground">
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
  reactionPickerFor,
  setReactionPickerFor,
  reactionsByComment,
  addReaction,
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
  reactionPickerFor: string | null;
  setReactionPickerFor: React.Dispatch<React.SetStateAction<string | null>>;
  reactionsByComment: Record<string, Record<string, number>>;
  addReaction: (commentId: string, emoji: string) => void;
}) {
  const canReply = level < MAX_REPLY_DEPTH;
  const showReply = replyingTo === comment.id && canReply;
  const hasReplies = comment.replies.length > 0;
  const repliesExpanded = expandedReplyIds.has(comment.id);
  const visibleCount = visibleReplyCounts[comment.id] ?? INITIAL_VISIBLE_REPLIES;
  const visibleReplies = repliesExpanded ? comment.replies.slice(0, visibleCount) : [];
  const remainingReplies = repliesExpanded ? comment.replies.length - visibleReplies.length : 0;
  const reactionPickerOpen = reactionPickerFor === comment.id;
  const reactionEntries = Object.entries(reactionsByComment[comment.id] ?? {});

  return (
    <li className="relative">
      {level > 0 && <span className="pointer-events-none absolute -left-5 top-5 h-px w-3 bg-border/70" />}
      <div className="flex gap-3 py-1.5">
        <div className="relative w-9 shrink-0">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
            {authorInitial(comment.authorLabel)}
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{comment.authorLabel}</span>
            {comment.isOriginalPoster && (
              <span className="rounded bg-foreground px-1.5 py-0.5 text-[11px] font-semibold text-background">
                OP
              </span>
            )}
            <span>{formatDate(comment.createdAt)}</span>
          </div>

          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{comment.content}</p>

          <div className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
            <CommentVoteButtons />
            {canReply && (
              <button
                type="button"
                onClick={() => setReplyingTo(showReply ? null : comment.id)}
                className="cursor-pointer rounded px-2 py-1 font-semibold transition-colors hover:bg-accent/70 hover:text-foreground"
              >
                {showReply ? "Cancel" : "Reply"}
              </button>
            )}
            {!canReply && (
              <span className="px-2 text-xs text-muted-foreground/80">Max depth</span>
            )}
            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  setReactionPickerFor((prev) => (prev === comment.id ? null : comment.id))
                }
                className="cursor-pointer rounded px-2 py-1 font-semibold transition-colors hover:bg-accent/70 hover:text-foreground"
              >
                React
              </button>
              {reactionPickerOpen && (
                <EmojiReactionPicker onPick={(emoji) => addReaction(comment.id, emoji)} />
              )}
            </div>
            {hasReplies && repliesExpanded && (
              <button
                type="button"
                onClick={() => toggleReplies(comment.id)}
                className="cursor-pointer rounded px-2 py-1 font-semibold transition-colors hover:bg-accent/70 hover:text-foreground"
              >
                Hide replies
              </button>
            )}
          </div>
          {reactionEntries.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              {reactionEntries.map(([emoji, count]) => (
                <button
                  key={`${comment.id}-${emoji}`}
                  type="button"
                  onClick={() => addReaction(comment.id, emoji)}
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2 py-0.5 text-xs text-foreground transition-colors hover:bg-accent/70"
                >
                  <span>{emoji}</span>
                  <span className="tabular-nums text-muted-foreground">{count}</span>
                </button>
              ))}
            </div>
          )}

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
        <div className="ml-12 mt-1">
          <button
            type="button"
            onClick={() => toggleReplies(comment.id)}
            className="inline-flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-accent/70 hover:text-foreground"
          >
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-border text-sm leading-none text-foreground">
              +
            </span>
            {`${comment.replies.length} more repl${comment.replies.length === 1 ? "y" : "ies"}`}
          </button>
        </div>
      )}

      {hasReplies && repliesExpanded && (
        <ul className="mt-1 ml-4 space-y-2 border-l border-border/70 pl-5">
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
              reactionPickerFor={reactionPickerFor}
              setReactionPickerFor={setReactionPickerFor}
              reactionsByComment={reactionsByComment}
              addReaction={addReaction}
            />
          ))}
          {remainingReplies > 0 && (
            <li>
              <button
                type="button"
                onClick={() => showMoreReplies(comment.id, comment.replies.length)}
                className="inline-flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-accent/70 hover:text-foreground"
              >
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-border text-sm leading-none text-foreground">
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

function CommentVoteButtons() {
  return (
    <div className="flex w-[74px] items-center">
      <div className="inline-flex items-center rounded-full border border-border/80 bg-card/70 p-0.5">
        <button
          type="button"
          aria-label="Upvote comment"
          className="grid h-6 w-6 cursor-pointer place-items-center rounded-full text-muted-foreground transition-colors hover:bg-orange-500/15 hover:text-orange-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5">
            <path d="M8 12V4" strokeLinecap="round" />
            <path d="m5 7 3-3 3 3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button
          type="button"
          aria-label="Downvote comment"
          className="grid h-6 w-6 cursor-pointer place-items-center rounded-full text-muted-foreground transition-colors hover:bg-primary/15 hover:text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5">
            <path d="M8 4v8" strokeLinecap="round" />
            <path d="m5 9 3 3 3-3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
