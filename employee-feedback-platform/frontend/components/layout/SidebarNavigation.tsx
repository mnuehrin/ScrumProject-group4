"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
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
  href?: string;
  label: string;
  icon: "home" | "submit" | "feed" | "rewards" | "admin" | "login" | "logout";
  action?: () => void;
};

const WORKSPACE_ITEMS: NavItem[] = [
  { href: "/", label: "Overview", icon: "home" },
  { href: "/submit", label: "Answer questions", icon: "submit" },
  { href: "/feedback", label: "Feedback feed", icon: "feed" },
  { href: "/rewards", label: "My rewards", icon: "rewards" },
];

const ADMIN_ITEMS: NavItem[] = [
  { href: "/admin/dashboard", label: "Analytics", icon: "admin" },
  { href: "/admin", label: "Dashboard", icon: "admin" },
  { href: "/admin/questions", label: "Create Post", icon: "admin" },
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
    active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
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
    case "logout":
      return (
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClass}>
          <path d="M12 6V4H4v12h8v-2M9 10h9M15 7l3 3-3 3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
  }
}

function NavLinks() {
  const pathname = usePathname();
  const { open, isMobile, setOpenMobile } = useSidebar();
  const { data: session } = useSession();
  const showLabels = open || isMobile;

  const moderationItems: NavItem[] = session?.user
    ? [
        ...ADMIN_ITEMS,
        { label: "Sign out", icon: "logout" as const, action: () => signOut({ callbackUrl: "/" }) },
      ]
    : [{ href: "/admin/login", label: "Admin sign in", icon: "login" as const }];

  const navGroups = [
    { title: "Workspace", items: WORKSPACE_ITEMS },
    { title: "Moderation", items: moderationItems },
  ];

  return (
    <div className="space-y-5">
      {navGroups.map((group, index) => (
        <div
          key={group.title}
          className={cn("space-y-2.5", index > 0 && "border-t border-border pt-5")}
        >
          <SidebarGroupLabel
            className={cn("text-[10px] tracking-[0.2em] text-muted-foreground", !showLabels && "md:sr-only")}
          >
            {group.title}
          </SidebarGroupLabel>
          <SidebarMenu>
            {group.items.map((item) => {
              const active = item.href ? isActive(pathname, item.href) : false;

              if (item.action) {
                return (
                  <SidebarMenuItem key={item.label}>
                    <button
                      onClick={() => {
                        if (isMobile) setOpenMobile(false);
                        item.action!();
                      }}
                      className={cn(
                        "group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-semibold transition-all",
                        showLabels ? "justify-start" : "justify-center",
                        "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                      )}
                    >
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors group-hover:bg-card/70">
                        <SidebarItemIcon icon={item.icon} active={false} />
                      </span>
                      <span className={cn("truncate", !showLabels && "md:hidden")}>
                        {item.label}
                      </span>
                    </button>
                  </SidebarMenuItem>
                );
              }

              return (
                <SidebarMenuItem key={item.href}>
                  <Link
                    href={item.href!}
                    onClick={() => {
                      if (isMobile) setOpenMobile(false);
                    }}
                    className={cn(
                      "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-semibold transition-all",
                      showLabels ? "justify-start" : "justify-center",
                      active
                        ? "bg-accent/70 text-foreground ring-1 ring-border"
                        : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                    )}
                  >
                    <span
                      className={cn(
                        "inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors",
                        active ? "bg-card/80 shadow-sm ring-1 ring-border" : "group-hover:bg-card/70"
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
  const companyLogoSrc =
    process.env.NEXT_PUBLIC_COMPANY_LOGO || "/Employee-Discussion-Board-Logo (2).svg";

  return (
    <Sidebar className="border-border bg-sidebar">
      <SidebarHeader className="border-border h-16">
        <div
          className={cn(
            "flex h-full items-center gap-3 px-1",
            !showLabels && "md:justify-center"
          )}
        >
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-border bg-card/70 shadow-sm">
            <Image
              src={companyLogoSrc}
              alt="Company logo"
              width={48}
              height={48}
              className="h-10 w-10 scale-150 object-contain"
            />
          </div>
          <div className={cn("space-y-1", !showLabels && "md:hidden")}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Employee Feedback
            </p>
            <p className="font-display text-lg font-semibold leading-none text-foreground">
              Navigation
            </p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavLinks />
      </SidebarContent>
      <SidebarFooter className="border-border">
        <p className={cn("px-2 text-[11px] text-muted-foreground", !showLabels && "md:hidden")}>
          v1.0 &middot; Feedback Platform
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}
