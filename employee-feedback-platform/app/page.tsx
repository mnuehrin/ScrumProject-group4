import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-6 py-16">
      <div className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Employee Feedback Platform
        </p>
        <h1 className="text-3xl font-semibold text-slate-900">
          Anonymous feedback, visible impact.
        </h1>
        <p className="text-base text-slate-600">
          Use this space to collect and act on employee feedback while keeping
          the loop transparent.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Link
          href="/submit"
          className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 shadow-sm transition hover:border-slate-300"
        >
          Submit feedback
        </Link>
        <Link
          href="/feedback"
          className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 shadow-sm transition hover:border-slate-300"
        >
          View feedback
        </Link>
        <Link
          href="/admin"
          className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 shadow-sm transition hover:border-slate-300"
        >
          Admin dashboard
        </Link>
      </div>
    </main>
  );
}
