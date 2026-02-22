import Link from "next/link";

export default function HomePage() {
  return (
    <section className="space-y-6 pb-6">
      <div className="space-y-3 rounded-2xl border border-border bg-card px-6 py-6 shadow-[0_12px_32px_-24px_rgba(15,23,42,0.3)]">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Employee Feedback Platform
        </p>
        <h1 className="sr-only">Overview</h1>
        <p className="text-base font-medium text-foreground">
          Anonymous feedback, visible impact.
        </p>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Use this space to collect and act on employee feedback while keeping
          the loop transparent.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/submit"
          className="group rounded-xl border border-border bg-card px-5 py-4 shadow-sm transition-all hover:shadow-md hover:bg-accent/50"
        >
          <p className="text-sm font-semibold text-foreground">Answer questions</p>
          <p className="mt-1 text-xs text-muted-foreground">Respond to active campaigns</p>
        </Link>
        <Link
          href="/feedback"
          className="group rounded-xl border border-border bg-card px-5 py-4 shadow-sm transition-all hover:shadow-md hover:bg-accent/50"
        >
          <p className="text-sm font-semibold text-foreground">View feedback</p>
          <p className="mt-1 text-xs text-muted-foreground">Browse and discuss submissions</p>
        </Link>
        <Link
          href="/admin"
          className="group rounded-xl border border-border bg-card px-5 py-4 shadow-sm transition-all hover:shadow-md hover:bg-accent/50"
        >
          <p className="text-sm font-semibold text-foreground">Admin dashboard</p>
          <p className="mt-1 text-xs text-muted-foreground">Manage feedback and rewards</p>
        </Link>
      </div>
    </section>
  );
}
