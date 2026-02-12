import type {
  Feedback,
  FeedbackCategory,
  FeedbackStatus,
  ActivityAction,
  Reward,
  RewardType,
  RewardStatus,
  FeedbackComment,
} from "@prisma/client";

export type {
  Feedback,
  FeedbackCategory,
  FeedbackStatus,
  ActivityAction,
  Reward,
  RewardType,
  RewardStatus,
  FeedbackComment,
};

export type FeedbackWithMeta = Feedback & {
  hasUpvoted: boolean;
  reward?: Reward | null;
  commentsCount: number;
};

export type SortOption = "newest" | "top";

export type CategoryFilter = FeedbackCategory | "ALL";

export type ThreadComment = Pick<
  FeedbackComment,
  "id" | "feedbackId" | "parentId" | "content" | "createdAt"
> & {
  authorLabel: string;
  isOriginalPoster: boolean;
};
