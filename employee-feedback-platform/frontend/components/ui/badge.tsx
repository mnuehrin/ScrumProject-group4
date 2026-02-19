import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "culture" | "tools" | "workload" | "management" | "other" | "pending" | "reviewed" | "in_progress" | "resolved";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200",
  culture: "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-200",
  tools: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200",
  workload: "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-200",
  management: "bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-200",
  other: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200",
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200",
  reviewed: "bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-200",
  in_progress: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200",
  resolved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200",
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
