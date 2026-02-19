import { z } from "zod";

export const createFeedbackSchema = z.object({
  content: z
    .string()
    .min(10, "Please provide at least 10 characters.")
    .max(2000, "Feedback must be 2000 characters or fewer."),
  category: z.enum(["CULTURE", "TOOLS", "WORKLOAD", "MANAGEMENT", "OTHER"], {
    errorMap: () => ({ message: "Please select a valid category." }),
  }),
});

export type CreateFeedbackInput = z.infer<typeof createFeedbackSchema>;

export const upvoteSchema = z.object({
  sessionId: z.string().min(1, "Session ID is required."),
});

export type UpvoteInput = z.infer<typeof upvoteSchema>;

export const awardSchema = z
  .object({
    rewardType: z.enum(["PROMO_CODE", "HOLIDAY_DAY"], {
      errorMap: () => ({ message: "Please select a valid reward type." }),
    }),
    promoCode: z.string().trim().min(1, "Promo code is required.").optional(),
  })
  .superRefine((data, ctx) => {
    if (data.rewardType === "PROMO_CODE" && !data.promoCode) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Promo code is required for promo code rewards.",
        path: ["promoCode"],
      });
    }
  });

export type AwardInput = z.infer<typeof awardSchema>;

export const redeemRewardSchema = z.object({
  claimCode: z.string().trim().min(6, "Claim code is required."),
  sessionId: z.string().min(1, "Session ID is required."),
});

export type RedeemRewardInput = z.infer<typeof redeemRewardSchema>;

export const createCommentSchema = z.object({
  sessionId: z.string().min(1, "Session ID is required."),
  content: z
    .string()
    .trim()
    .min(2, "Comment must be at least 2 characters.")
    .max(1000, "Comment must be 1000 characters or fewer."),
  parentId: z.string().uuid("Invalid parent comment ID.").optional(),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;

export const createCampaignSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters."),
  description: z.string().trim().max(2000).optional(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
  category: z.enum(["CULTURE", "TOOLS", "WORKLOAD", "MANAGEMENT", "OTHER"], {
    errorMap: () => ({ message: "Please select a valid category." }),
  }),
  status: z.enum(["DRAFT", "LIVE", "ARCHIVED"]).optional(),
});

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;

export const updateCampaignSchema = z.object({
  title: z.string().trim().min(3).optional(),
  description: z.string().trim().max(2000).optional(),
  startsAt: z.string().datetime().nullable().optional(),
  endsAt: z.string().datetime().nullable().optional(),
  category: z
    .enum(["CULTURE", "TOOLS", "WORKLOAD", "MANAGEMENT", "OTHER"])
    .optional(),
  status: z.enum(["DRAFT", "LIVE", "ARCHIVED"]).optional(),
});

export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>;

export const createQuestionSchema = z.object({
  prompt: z.string().trim().min(3, "Question prompt is required."),
  type: z.enum(["TEXT"]).optional(),
  order: z.number().int().min(0).optional(),
});

export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;

export const submitResponseSchema = z.object({
  sessionId: z.string().min(1, "Session ID is required."),
  content: z
    .string()
    .trim()
    .min(2, "Response must be at least 2 characters.")
    .max(2000, "Response must be 2000 characters or fewer."),
});

export type SubmitResponseInput = z.infer<typeof submitResponseSchema>;
