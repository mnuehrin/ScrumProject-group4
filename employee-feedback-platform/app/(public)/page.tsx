import Link from "next/link";

export default function HomePage() {
  return (
    <section className="space-y-6 pb-6">
      <div className="space-y-3 rounded-xl border border-slate-200 bg-white px-6 py-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Employee Feedback Platform
        </p>
        <h1 className="sr-only">Overview</h1>
        <p className="text-base font-medium text-slate-700">
          Anonymous feedback, visible impact.
        </p>
        <p className="max-w-2xl text-sm leading-relaxed text-slate-600">
          Use this space to collect and act on employee feedback while keeping
          the loop transparent.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/submit"
          className="group rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition-all hover:border-slate-300 hover:shadow-md active:bg-slate-50"
        >
          <p className="text-sm font-semibold text-slate-900">Answer questions</p>
          <p className="mt-1 text-xs text-slate-500">Respond to active campaigns</p>
        </Link>
        <Link
          href="/feedback"
          className="group rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition-all hover:border-slate-300 hover:shadow-md active:bg-slate-50"
        >
          <p className="text-sm font-semibold text-slate-900">View feedback</p>
          <p className="mt-1 text-xs text-slate-500">Browse and discuss submissions</p>
        </Link>
        <Link
          href="/admin"
          className="group rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition-all hover:border-slate-300 hover:shadow-md active:bg-slate-50"
        >
          <p className="text-sm font-semibold text-slate-900">Admin dashboard</p>
          <p className="mt-1 text-xs text-slate-500">Manage feedback and rewards</p>
        </Link>
      </div>
    </section>
  );
}
