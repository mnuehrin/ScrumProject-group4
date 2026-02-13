import { FeedbackForm } from "@/components/feedback/FeedbackForm";

export default function SubmitPage() {
  return (
    <section className="max-w-2xl space-y-7 rounded-xl border border-slate-200 bg-white px-5 py-6 sm:px-6 sm:py-7">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900">
          Submit anonymous feedback
        </h1>
        <p className="text-sm text-slate-600">
          Your feedback is completely anonymous. Select a category and a guided
          prompt will help you write something actionable.
        </p>
      </div>
      <FeedbackForm />
    </section>
  );
}
