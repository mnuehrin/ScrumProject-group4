"use client";

import { useState, Fragment } from "react";
import { Badge } from "@/components/ui/badge";
import type { FeedbackWithMeta, FeedbackCategory, FeedbackStatus, CategoryFilter } from "@/types";

const CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  CULTURE: "Culture",
  TOOLS: "Tools",
  WORKLOAD: "Workload",
  MANAGEMENT: "Management",
  OTHER: "Other",
};

const CATEGORY_VARIANTS: Record<FeedbackCategory, "culture" | "tools" | "workload" | "management" | "other"> = {
  CULTURE: "culture",
  TOOLS: "tools",
  WORKLOAD: "workload",
  MANAGEMENT: "management",
  OTHER: "other",
};

const STATUS_LABELS: Record<FeedbackStatus, string> = {
  PENDING: "Pending",
  REVIEWED: "Reviewed",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
};

const STATUS_VARIANTS: Record<FeedbackStatus, "pending" | "reviewed" | "in_progress" | "resolved"> = {
  PENDING: "pending",
  REVIEWED: "reviewed",
  IN_PROGRESS: "in_progress",
  RESOLVED: "resolved",
};

const CATEGORY_TABS: { value: CategoryFilter; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "CULTURE", label: "Culture" },
  { value: "TOOLS", label: "Tools" },
  { value: "WORKLOAD", label: "Workload" },
  { value: "MANAGEMENT", label: "Management" },
  { value: "OTHER", label: "Other" },
];

interface FeedbackTableProps {
  feedback: FeedbackWithMeta[];
}

export function FeedbackTable({ feedback }: FeedbackTableProps) {
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = feedback.filter(
    (f) => activeCategory === "ALL" || f.category === activeCategory
  );

  const formattedDate = (d: Date) =>
    new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(d));

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(["PENDING", "REVIEWED", "IN_PROGRESS", "RESOLVED"] as FeedbackStatus[]).map((s) => {
          const count = feedback.filter((f) => f.status === s).length;
          return (
            <div key={s} className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs text-slate-500 mb-1">{STATUS_LABELS[s]}</p>
              <p className="text-2xl font-semibold text-slate-900">{count}</p>
            </div>
          );
        })}
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-1.5">
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveCategory(tab.value)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              activeCategory === tab.value
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {tab.label}
            <span className="ml-1.5 text-xs opacity-70">
              {tab.value === "ALL"
                ? feedback.length
                : feedback.filter((f) => f.category === tab.value).length}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          No feedback in this category.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 w-[45%]">
                  Feedback
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">
                  Upvotes
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((item) => (
                <Fragment key={item.id}>
                  <tr
                    onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                    className="cursor-pointer transition-colors hover:bg-slate-50"
                  >
                    <td className="px-4 py-3 text-slate-700">
                      <p className="line-clamp-2">{item.content}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={CATEGORY_VARIANTS[item.category]}>
                        {CATEGORY_LABELS[item.category]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_VARIANTS[item.status]}>
                        {STATUS_LABELS[item.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{item.upvotes}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {formattedDate(item.createdAt)}
                    </td>
                  </tr>
                  {expandedId === item.id && (
                    <tr className="bg-slate-50">
                      <td colSpan={5} className="px-4 py-4">
                        <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                          {item.content}
                        </p>
                        {item.adminNote && (
                          <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2">
                            <p className="text-xs font-medium text-blue-700 mb-0.5">Admin note</p>
                            <p className="text-xs text-blue-600">{item.adminNote}</p>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
