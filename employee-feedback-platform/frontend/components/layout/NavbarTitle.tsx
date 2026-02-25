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
  { match: (pathname) => pathname.startsWith("/admin/dashboard"), title: "Analytics", eyebrow: "Moderation" },
  { match: (pathname) => pathname.startsWith("/admin/questions"), title: "Create Post", eyebrow: "Moderation" },
  { match: (pathname) => pathname.startsWith("/admin/login"), title: "Sign in", eyebrow: "Moderation" },
  { match: (pathname) => pathname.startsWith("/admin"), title: "Dashboard", eyebrow: "Moderation" },
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
      <span className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
        {eyebrow}
      </span>
      <span className="font-display text-lg font-semibold text-foreground sm:text-xl">
        {title}
      </span>
    </div>
  );
}
