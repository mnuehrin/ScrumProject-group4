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
