import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { FeedbackWithMeta, FeedbackCategory, FeedbackStatus } from "@/types";

const CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  CULTURE: "Culture",
  TOOLS: "Tools",
  WORKLOAD: "Workload",
  MANAGEMENT: "Management",
  OTHER: "Other",
};

const CATEGORY_VARIANTS: Record<FeedbackCategory, "culture" | "tools" | "workload" | "management" | "other"> = {
  CULTURE: "culture",
  TOOLS: "tools",
  WORKLOAD: "workload",
  MANAGEMENT: "management",
  OTHER: "other",
};

const STATUS_LABELS: Record<FeedbackStatus, string> = {
  PENDING: "Pending",
  REVIEWED: "Reviewed",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
};

const STATUS_VARIANTS: Record<FeedbackStatus, "pending" | "reviewed" | "in_progress" | "resolved"> = {
  PENDING: "pending",
  REVIEWED: "reviewed",
  IN_PROGRESS: "in_progress",
  RESOLVED: "resolved",
};

interface FeedbackCardProps {
  feedback: FeedbackWithMeta;
  upvoteSlot?: React.ReactNode;
}

export function FeedbackCard({ feedback, upvoteSlot }: FeedbackCardProps) {
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(feedback.createdAt));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={CATEGORY_VARIANTS[feedback.category]}>
              {CATEGORY_LABELS[feedback.category]}
            </Badge>
            <Badge variant={STATUS_VARIANTS[feedback.status]}>
              {STATUS_LABELS[feedback.status]}
            </Badge>
          </div>
          <span className="shrink-0 text-xs text-slate-400">{formattedDate}</span>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
          {feedback.content}
        </p>
        {feedback.adminNote && (
          <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2">
            <p className="text-xs font-medium text-blue-700 mb-0.5">Admin note</p>
            <p className="text-xs text-blue-600">{feedback.adminNote}</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="justify-between">
        {upvoteSlot}
      </CardFooter>
    </Card>
  );
}
