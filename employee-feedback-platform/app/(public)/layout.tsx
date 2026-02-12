import Link from "next/link";

export default function PublicLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-8 px-6 py-12">
      <header className="flex items-center justify-between">
        <Link href="/" className="text-sm font-semibold text-slate-700">
          Employee Feedback
        </Link>
        <nav className="flex items-center gap-3 text-sm text-slate-600">
          <Link href="/submit" className="hover:text-slate-900">
            Submit
          </Link>
          <Link href="/feedback" className="hover:text-slate-900">
            Feedback
          </Link>
        </nav>
      </header>
      {children}
    </main>
  );
}
