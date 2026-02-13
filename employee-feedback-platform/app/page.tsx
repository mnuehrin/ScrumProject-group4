import Link from "next/link";
import { SidebarNavigation } from "@/components/layout/SidebarNavigation";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export default function HomePage() {
  return (
    <SidebarProvider>
      <SidebarNavigation />
      <SidebarInset className="bg-slate-50">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-slate-200 bg-slate-50/95 px-4 backdrop-blur sm:px-6">
          <SidebarTrigger />
          <p className="text-sm font-medium text-slate-700">Overview</p>
        </header>
        <main className="mr-auto w-full max-w-[1200px] px-5 py-6 sm:px-7 lg:px-9">
          <section className="space-y-8 pb-6">
            <div className="space-y-3 rounded-xl border border-slate-200 bg-white px-6 py-6">
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Employee Feedback Platform
              </p>
              <h1 className="text-3xl font-semibold text-slate-900">
                Anonymous feedback, visible impact.
              </h1>
              <p className="max-w-2xl text-base text-slate-600">
                Use this space to collect and act on employee feedback while keeping
                the loop transparent.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
          </section>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
