import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "culture" | "tools" | "workload" | "management" | "other" | "pending" | "reviewed" | "in_progress" | "resolved";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-slate-100 text-slate-700",
  culture: "bg-purple-100 text-purple-700",
  tools: "bg-blue-100 text-blue-700",
  workload: "bg-orange-100 text-orange-700",
  management: "bg-pink-100 text-pink-700",
  other: "bg-slate-100 text-slate-600",
  pending: "bg-yellow-100 text-yellow-700",
  reviewed: "bg-blue-100 text-blue-700",
  in_progress: "bg-indigo-100 text-indigo-700",
  resolved: "bg-green-100 text-green-700",
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
