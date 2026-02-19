"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type SidebarContextValue = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  openMobile: boolean;
  setOpenMobile: React.Dispatch<React.SetStateAction<boolean>>;
  isMobile: boolean;
  toggleSidebar: () => void;
};

const SidebarContext = React.createContext<SidebarContextValue | null>(null);

function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const handleChange = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches);
    };

    setIsMobile(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return isMobile;
}

export function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within SidebarProvider.");
  }
  return context;
}

export function SidebarProvider({
  defaultOpen = true,
  className,
  children,
}: React.HTMLAttributes<HTMLDivElement> & {
  defaultOpen?: boolean;
}) {
  const isMobile = useIsMobile();
  const [open, setOpen] = React.useState(defaultOpen);
  const [openMobile, setOpenMobile] = React.useState(false);

  const toggleSidebar = React.useCallback(() => {
    if (isMobile) {
      setOpenMobile((value) => !value);
      return;
    }
    setOpen((value) => !value);
  }, [isMobile]);

  const contextValue = React.useMemo(
    () => ({
      open,
      setOpen,
      openMobile,
      setOpenMobile,
      isMobile,
      toggleSidebar,
    }),
    [open, openMobile, isMobile, toggleSidebar]
  );

  return (
    <SidebarContext.Provider value={contextValue}>
      <div className={cn("flex min-h-screen w-full", className)}>{children}</div>
    </SidebarContext.Provider>
  );
}

export const Sidebar = React.forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement>
>(({ className, children, ...props }, ref) => {
  const { open, openMobile, setOpenMobile } = useSidebar();

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-slate-900/20 transition-opacity md:hidden",
          openMobile ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setOpenMobile(false)}
      />
      <aside
        ref={ref}
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 -translate-x-full border-r border-slate-200 bg-white transition-transform duration-200 md:static md:z-0 md:translate-x-0 md:transition-[width] md:duration-200",
          openMobile && "translate-x-0",
          open ? "md:w-64" : "md:w-16",
          className
        )}
        {...props}
      >
        <div className="flex h-full flex-col overflow-hidden">{children}</div>
      </aside>
    </>
  );
});
Sidebar.displayName = "Sidebar";

export const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex h-16 items-center border-b border-slate-200 px-4",
      className
    )}
    {...props}
  />
));
SidebarHeader.displayName = "SidebarHeader";

export const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex-1 overflow-y-auto p-3", className)}
    {...props}
  />
));
SidebarContent.displayName = "SidebarContent";

export const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("border-t border-slate-200 px-4 py-3", className)}
    {...props}
  />
));
SidebarFooter.displayName = "SidebarFooter";

export const SidebarGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("mb-3", className)} {...props} />
));
SidebarGroup.displayName = "SidebarGroup";

export const SidebarGroupLabel = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      "px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400",
      className
    )}
    {...props}
  />
));
SidebarGroupLabel.displayName = "SidebarGroupLabel";

export const SidebarMenu = React.forwardRef<
  HTMLUListElement,
  React.HTMLAttributes<HTMLUListElement>
>(({ className, ...props }, ref) => (
  <ul ref={ref} className={cn("space-y-0.5", className)} {...props} />
));
SidebarMenu.displayName = "SidebarMenu";

export const SidebarMenuItem = React.forwardRef<
  HTMLLIElement,
  React.HTMLAttributes<HTMLLIElement>
>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn("list-none", className)} {...props} />
));
SidebarMenuItem.displayName = "SidebarMenuItem";

export const SidebarInset = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("min-w-0 flex-1", className)} {...props} />
));
SidebarInset.displayName = "SidebarInset";

export const SidebarTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, onClick, ...props }, ref) => {
  const { toggleSidebar } = useSidebar();

  return (
    <button
      ref={ref}
      type="button"
      onClick={(event) => {
        toggleSidebar();
        onClick?.(event);
      }}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900",
        className
      )}
      {...props}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        className="h-4 w-4"
      >
        <path d="M3 5h14M3 10h14M3 15h14" strokeLinecap="round" />
      </svg>
    </button>
  );
});
SidebarTrigger.displayName = "SidebarTrigger";
