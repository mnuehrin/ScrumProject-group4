"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

type NavItem = {
  href: string;
  label: string;
  icon: "home" | "submit" | "feed" | "rewards" | "admin" | "login";
};

const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: "Workspace",
    items: [
      { href: "/", label: "Overview", icon: "home" },
      { href: "/submit", label: "Answer questions", icon: "submit" },
      { href: "/feedback", label: "Feedback feed", icon: "feed" },
      { href: "/rewards", label: "My rewards", icon: "rewards" },
    ],
  },
  {
    title: "Moderation",
    items: [
      { href: "/admin", label: "Admin dashboard", icon: "admin" },
      { href: "/admin/questions", label: "Question admin", icon: "admin" },
      { href: "/admin/login", label: "Admin sign in", icon: "login" },
    ],
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarItemIcon({
  icon,
  active,
}: {
  icon: NavItem["icon"];
  active: boolean;
}) {
  const iconClass = cn(
    "h-4 w-4",
    active ? "text-slate-700" : "text-slate-400 group-hover:text-slate-700"
  );

  switch (icon) {
    case "home":
      return (
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClass}>
          <path d="M3.5 9.5 10 4l6.5 5.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5.5 8.5V16h9V8.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "submit":
      return (
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClass}>
          <path d="M10 4v12M4 10h12" strokeLinecap="round" />
        </svg>
      );
    case "feed":
      return (
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClass}>
          <path d="M5 5h10M5 10h10M5 15h10" strokeLinecap="round" />
        </svg>
      );
    case "rewards":
      return (
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClass}>
          <path d="M10 4 12.2 8.4 17 9l-3.5 3.2.9 4.8L10 14.8 5.6 17l.9-4.8L3 9l4.8-.6L10 4Z" strokeLinejoin="round" />
        </svg>
      );
    case "admin":
      return (
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClass}>
          <path d="M10 3 16 6v4c0 3.7-2.3 5.9-6 7-3.7-1.1-6-3.3-6-7V6l6-3Z" strokeLinejoin="round" />
        </svg>
      );
    case "login":
      return (
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClass}>
          <path d="M8 6V4h8v12H8v-2M4 10h9M10 7l3 3-3 3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
  }
}

function NavLinks() {
  const pathname = usePathname();
  const { open, isMobile, setOpenMobile } = useSidebar();
  const showLabels = open || isMobile;

  return (
    <div className="space-y-4">
      {NAV_GROUPS.map((group, index) => (
        <div
          key={group.title}
          className={cn("space-y-2", index > 0 && "border-t border-slate-200 pt-4")}
        >
          <SidebarGroupLabel className={cn("text-slate-400", !showLabels && "md:sr-only")}>
            {group.title}
          </SidebarGroupLabel>
          <SidebarMenu>
            {group.items.map((item) => {
              const active = isActive(pathname, item.href);

              return (
                <SidebarMenuItem key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => {
                      if (isMobile) setOpenMobile(false);
                    }}
                    className={cn(
                      "group flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      showLabels ? "justify-start" : "justify-center",
                      active
                        ? "bg-slate-100 text-slate-900"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    )}
                  >
                    <span
                      className={cn(
                        "inline-flex h-6 w-6 items-center justify-center rounded-md"
                      )}
                    >
                      <SidebarItemIcon icon={item.icon} active={active} />
                    </span>
                    <span className={cn("truncate", !showLabels && "md:hidden")}>
                      {item.label}
                    </span>
                  </Link>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </div>
      ))}
    </div>
  );
}

export function SidebarNavigation() {
  const { open, isMobile } = useSidebar();
  const showLabels = open || isMobile;

  return (
    <Sidebar className="border-slate-200 bg-white">
      <SidebarHeader className="border-slate-200">
        <div className={cn("flex items-center gap-2.5 px-1", !showLabels && "md:justify-center")}>
          <div className={cn("space-y-0.5", !showLabels && "md:hidden")}>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Employee Feedback
            </p>
            <p className="text-base font-semibold leading-none text-slate-800">Navigation</p>
          </div>
          {!showLabels && (
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              EF
            </p>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavLinks />
      </SidebarContent>
      <SidebarFooter className="border-slate-200">
        <p className={cn("px-2 text-xs text-slate-400", !showLabels && "md:hidden")}>
          v1.0 &middot; Feedback Platform
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}
