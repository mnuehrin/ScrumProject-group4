"use client";

type CategoryValue = "ALL" | "CULTURE" | "TOOLS" | "WORKLOAD" | "MANAGEMENT" | "OTHER";

const TABS: { value: CategoryValue; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "CULTURE", label: "Culture" },
  { value: "TOOLS", label: "Tools" },
  { value: "WORKLOAD", label: "Workload" },
  { value: "MANAGEMENT", label: "Management" },
  { value: "OTHER", label: "Other" },
];

interface CategoryPillsProps {
  active: CategoryValue;
  onChange: (value: CategoryValue) => void;
  counts?: Partial<Record<CategoryValue, number>>;
}

export function CategoryPills({ active, onChange, counts }: CategoryPillsProps) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {TABS.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={`cursor-pointer rounded-full border px-4 py-1.5 text-[13px] font-semibold transition-all ${
            active === tab.value
              ? "border-transparent bg-primary text-primary-foreground shadow-sm"
              : "border-border bg-card/80 text-muted-foreground hover:bg-accent/60 hover:text-foreground"
          }`}
        >
          {tab.label}
          {counts?.[tab.value] !== undefined && (
            <span className="ml-1.5 tabular-nums opacity-70">{counts[tab.value]}</span>
          )}
        </button>
      ))}
    </div>
  );
}

export type { CategoryValue };
