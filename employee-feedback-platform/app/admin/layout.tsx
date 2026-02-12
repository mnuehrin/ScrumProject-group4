import Link from "next/link";

export default function AdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-6 py-12">
      <header className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Admin
          </p>
          <h1 className="text-lg font-semibold text-slate-900">
            Feedback dashboard
          </h1>
        </div>
        <Link href="/" className="text-sm text-slate-600 hover:text-slate-900">
          Back to home
        </Link>
      </header>
      {children}
    </main>
  );
}
