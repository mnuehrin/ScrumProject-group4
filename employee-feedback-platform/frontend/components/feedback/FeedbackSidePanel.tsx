const COMMUNITY_RULES = [
  {
    title: "Be respectful",
    description:
      "No abusive, hateful, or harassing comments. Critique ideas and processes, not people.",
  },
  {
    title: "Keep it professional",
    description:
      "Use workplace-appropriate language. Avoid profanity, threats, or inflammatory remarks.",
  },
  {
    title: "No personal information",
    description:
      "Do not share private or identifying details about colleagues, customers, or partners.",
  },
  {
    title: "Stay constructive",
    description:
      "When raising an issue, include context and practical suggestions whenever possible.",
  },
  {
    title: "No illegal or unsafe content",
    description:
      "Do not post content that encourages illegal activity, policy violations, or unsafe behavior.",
  },
] as const;

interface FeedbackSidePanelProps {
  companyName: string;
  liveCampaigns: number;
  weeklyActivity: number;
}

export function FeedbackSidePanel({
  companyName,
  liveCampaigns,
  weeklyActivity,
}: FeedbackSidePanelProps) {
  return (
    <aside className="xl:sticky xl:top-4">
      <section className="overflow-hidden rounded-xl border border-sidebar-border bg-sidebar text-sidebar-foreground">
        <div className="border-b border-sidebar-border px-5 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Workspace
          </p>
          <h2 className="mt-1.5 font-display text-xl font-semibold leading-tight text-foreground">
            {companyName}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Anonymous feedback space for employees. Keep discussions helpful, respectful, and focused on improving the workplace.
          </p>
        </div>
        <div className="grid grid-cols-2 border-b border-sidebar-border px-5 py-4">
          <div className="border-r border-sidebar-border pr-4">
            <p className="text-3xl font-semibold tabular-nums text-foreground">{liveCampaigns}</p>
            <p className="text-xs text-muted-foreground">Live campaigns</p>
          </div>
          <div className="pl-4">
            <p className="text-3xl font-semibold tabular-nums text-foreground">{weeklyActivity}</p>
            <p className="text-xs text-muted-foreground">Posts this week</p>
          </div>
        </div>
        <div className="border-b border-sidebar-border px-5 py-4">
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Community Rules
          </h3>
        </div>
        <ol className="px-5 py-1">
          {COMMUNITY_RULES.map((rule, index) => (
            <li key={rule.title} className="border-b border-sidebar-border/80 py-3 last:border-0">
              <div className="flex items-start gap-2">
                <span className="mt-0.5 text-sm font-semibold tabular-nums text-muted-foreground">
                  {index + 1}
                </span>
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold text-foreground">{rule.title}</p>
                  <p className="text-sm leading-relaxed text-muted-foreground">{rule.description}</p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </aside>
  );
}
