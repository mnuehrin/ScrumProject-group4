import { FeedbackForm } from "@/components/feedback/FeedbackForm";

export default function SubmitFeedbackPage() {
  return (
    <section className="mx-auto w-full max-w-2xl space-y-4">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Submit feedback</h1>
        <p className="text-sm text-muted-foreground">
          Your submission is anonymous. Be specific so it’s actionable.
        </p>
      </div>
      <FeedbackForm />
    </section>
  );
}