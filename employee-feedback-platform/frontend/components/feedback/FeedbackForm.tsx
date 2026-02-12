"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createFeedbackSchema, type CreateFeedbackInput } from "@/lib/validations";
import { getSessionId } from "@/components/feedback/session";

const CATEGORY_OPTIONS = [
  { value: "CULTURE", label: "Culture" },
  { value: "TOOLS", label: "Tools" },
  { value: "WORKLOAD", label: "Workload" },
  { value: "MANAGEMENT", label: "Management" },
  { value: "OTHER", label: "Other" },
] as const;

const GUIDED_PROMPTS: Record<string, string> = {
  CULTURE: "What specific aspect of culture would you improve and how?",
  TOOLS: "Which tool is causing friction? What would make it better?",
  WORKLOAD: "What tasks could be eliminated or automated?",
  MANAGEMENT: "What management practice would help you be more effective?",
  OTHER: "Share anything on your mind — all feedback is welcome.",
};

type Status = "idle" | "loading" | "success" | "error";

export function FeedbackForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [charCount, setCharCount] = useState(0);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateFeedbackInput>({
    resolver: zodResolver(createFeedbackSchema),
  });

  const selectedCategory = watch("category");
  const prompt = selectedCategory ? GUIDED_PROMPTS[selectedCategory] : null;

  async function onSubmit(data: CreateFeedbackInput) {
    setStatus("loading");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": getSessionId(),
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Submission failed");

      setStatus("success");
      reset();
      setCharCount(0);
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center space-y-3">
        <p className="text-green-800 font-medium">Feedback submitted!</p>
        <p className="text-sm text-green-700">
          Your feedback has been recorded anonymously. Thank you for helping improve things.
        </p>
        <button
          onClick={() => setStatus("idle")}
          className="text-sm text-green-700 underline hover:text-green-900"
        >
          Submit another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Category */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-700">Category</label>
        <select
          {...register("category")}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
          defaultValue=""
        >
          <option value="" disabled>
            Select a category…
          </option>
          {CATEGORY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {errors.category && (
          <p className="text-xs text-red-600">{errors.category.message}</p>
        )}
      </div>

      {/* Guided prompt */}
      {prompt && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-sm text-slate-600 italic">{prompt}</p>
        </div>
      )}

      {/* Content */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-slate-700">Your feedback</label>
          <span className="text-xs text-slate-400">{charCount} / 2000</span>
        </div>
        <Textarea
          {...register("content", {
            onChange: (e) => setCharCount(e.target.value.length),
          })}
          placeholder="Be as specific as possible — actionable feedback makes the biggest difference."
          rows={5}
        />
        {errors.content && (
          <p className="text-xs text-red-600">{errors.content.message}</p>
        )}
      </div>

      {status === "error" && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Something went wrong. Please try again.
        </p>
      )}

      <Button type="submit" disabled={status === "loading"} size="lg" className="w-full">
        {status === "loading" ? "Submitting…" : "Submit anonymously"}
      </Button>

      <p className="text-center text-xs text-slate-400">
        Your submission is completely anonymous — no names, no IPs logged. If your feedback is
        awarded, claim codes appear in My rewards.
      </p>
    </form>
  );
}
