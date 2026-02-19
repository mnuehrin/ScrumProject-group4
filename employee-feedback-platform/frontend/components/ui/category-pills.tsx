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
    <div className="flex flex-wrap gap-2">
      {TABS.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={`cursor-pointer rounded-full px-4 py-2 text-sm font-medium transition-all ${
            active === tab.value
              ? "bg-slate-900 text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200 active:bg-slate-300"
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
