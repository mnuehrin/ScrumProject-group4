import Image from "next/image";

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
  companyLogoSrc: string;
  liveCampaigns: number;
  weeklyActivity: number;
}

export function FeedbackSidePanel({
  companyName,
  companyLogoSrc,
  liveCampaigns,
  weeklyActivity,
}: FeedbackSidePanelProps) {
  return (
    <aside className="xl:h-full">
      <section className="overflow-hidden rounded-xl border border-sidebar-border bg-sidebar text-sidebar-foreground xl:flex xl:h-full xl:flex-col">
        <div className="border-b border-sidebar-border px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-sidebar-border bg-card/60">
              <Image
                src={companyLogoSrc}
                alt={`${companyName} logo`}
                width={56}
                height={56}
                className="h-14 w-14 object-contain"
              />
            </div>
            <div>
              <h2 className="font-display text-xl font-semibold leading-tight text-foreground">
                {companyName}
              </h2>
            </div>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Anonymous feedback space for employees. Keep discussions helpful, respectful, and focused on improving the workplace.
          </p>
        </div>
        <div className="grid grid-cols-2 border-b border-sidebar-border px-5 py-4">
          <div className="border-r border-sidebar-border pr-4">
            <p className="text-3xl font-semibold tabular-nums text-foreground">{liveCampaigns}</p>
            <p className="text-xs text-muted-foreground">Live posts</p>
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
        <div className="px-5 py-1 xl:min-h-0 xl:flex-1 xl:overflow-y-auto xl:pb-2">
          {COMMUNITY_RULES.map((rule, index) => (
            <details key={rule.title} className="group border-b border-sidebar-border/80 last:border-0">
              <summary className="flex cursor-pointer list-none items-start gap-2 py-3 [&::-webkit-details-marker]:hidden">
                <span className="mt-0.5 text-sm font-semibold tabular-nums text-muted-foreground">
                  {index + 1}
                </span>
                <span className="text-sm font-semibold text-foreground">{rule.title}</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="ml-auto mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                >
                  <path d="m5 8 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </summary>
              <p className="pb-3 pl-7 text-sm leading-relaxed text-muted-foreground">
                {rule.description}
              </p>
            </details>
          ))}
        </div>
      </section>
    </aside>
  );
}
