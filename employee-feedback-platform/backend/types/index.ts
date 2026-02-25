import type {
  Feedback,
  FeedbackCategory,
  FeedbackStatus,
  ActivityAction,
  Reward,
  RewardType,
  RewardStatus,
  FeedbackComment,
  Campaign,
  CampaignStatus,
  Question,
  QuestionType,
  QuestionResponse,
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
  Campaign,
  CampaignStatus,
  Question,
  QuestionType,
  QuestionResponse,
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

export type CampaignWithQuestions = Campaign & {
  questions: Question[];
};

export type QuestionWithMeta = Question & {
  hasResponded?: boolean;
  responsesCount?: number;
};
