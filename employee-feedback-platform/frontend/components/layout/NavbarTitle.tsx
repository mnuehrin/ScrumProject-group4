"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type NavTitle = {
  title: string;
  eyebrow: string;
};

const TITLE_MAP: Array<{
  match: (pathname: string) => boolean;
  title: string;
  eyebrow: string;
}> = [
  { match: (pathname) => pathname === "/", title: "Overview", eyebrow: "Workspace" },
  { match: (pathname) => pathname.startsWith("/submit"), title: "Answer admin questions", eyebrow: "Workspace" },
  { match: (pathname) => pathname.startsWith("/feedback"), title: "Feedback feed", eyebrow: "Workspace" },
  { match: (pathname) => pathname.startsWith("/rewards"), title: "My rewards", eyebrow: "Workspace" },
  { match: (pathname) => pathname.startsWith("/admin/questions"), title: "Question campaigns", eyebrow: "Moderation" },
  { match: (pathname) => pathname.startsWith("/admin/login"), title: "Sign in", eyebrow: "Moderation" },
  { match: (pathname) => pathname.startsWith("/admin"), title: "Admin dashboard", eyebrow: "Moderation" },
];

const FALLBACK_TITLE: NavTitle = { title: "Public workspace", eyebrow: "Workspace" };

function getNavTitle(pathname: string): NavTitle {
  for (const entry of TITLE_MAP) {
    if (entry.match(pathname)) {
      return { title: entry.title, eyebrow: entry.eyebrow };
    }
  }
  return FALLBACK_TITLE;
}

export function NavbarTitle({ className }: { className?: string }) {
  const pathname = usePathname();
  const { title, eyebrow } = getNavTitle(pathname);

  return (
    <div className={cn("flex flex-col leading-tight", className)}>
      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
        {eyebrow}
      </span>
      <span className="font-display text-lg font-semibold text-slate-900 sm:text-xl">
        {title}
      </span>
    </div>
  );
}
