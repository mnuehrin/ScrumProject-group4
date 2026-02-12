import type { Feedback, FeedbackCategory, FeedbackStatus, ActivityAction } from "@prisma/client";

export type { Feedback, FeedbackCategory, FeedbackStatus, ActivityAction };

export type FeedbackWithMeta = Feedback & {
  hasUpvoted: boolean;
};

export type SortOption = "newest" | "top";

export type CategoryFilter = FeedbackCategory | "ALL";
