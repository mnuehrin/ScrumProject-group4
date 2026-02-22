"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Admin Error]", error);
  }, [error]);

  return (
    <section className="space-y-6">
      <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 dark:border-red-800 dark:bg-red-950/40">
        <p className="font-semibold text-red-800 dark:text-red-200">
          Something went wrong
        </p>
        <p className="mt-1 text-sm text-red-700 dark:text-red-300">
          {error.message}
        </p>
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-lg border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-700 dark:bg-red-900/30 dark:text-red-200 dark:hover:bg-red-900/50"
          >
            Try again
          </button>
          <Link
            href="/admin"
            className="rounded-lg border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-700 dark:bg-red-900/30 dark:text-red-200 dark:hover:bg-red-900/50"
          >
            Back to admin
          </Link>
        </div>
      </div>
    </section>
  );
}
