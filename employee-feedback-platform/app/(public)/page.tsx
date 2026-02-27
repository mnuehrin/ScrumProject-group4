import Link from "next/link";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";

// 1. Fetch live campaigns and their active questions
async function getLiveCampaigns() {
  const now = new Date();
  const campaigns = await prisma.campaign.findMany({
    where: {
      status: "LIVE",
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
      ],
    },
    include: {
      _count: { select: { questions: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 3,
  });
  return campaigns;
}

// 2. Fetch trailing 7 days trending feedback
async function getTrendingFeedback() {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const trending = await prisma.feedback.findMany({
    where: {
      questionId: null,
      createdAt: { gte: oneWeekAgo },
    },
    orderBy: [
      { upvotes: "desc" },
      { createdAt: "desc" },
    ],
    take: 3,
    include: {
      _count: { select: { comments: true } },
    }
  });
  return trending;
}

const CATEGORY_LABELS: Record<string, string> = {
  CULTURE: "Culture",
  TOOLS: "Tools",
  WORKLOAD: "Workload",
  MANAGEMENT: "Management",
  OTHER: "Other",
};

export default async function HomePage() {
  const liveCampaigns = await getLiveCampaigns();
  const trendingFeedback = await getTrendingFeedback();

  return (
    <section className="space-y-8 pb-8 animate-in fade-in duration-500">

      {/* 1. Modern Hero Section */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card px-8 py-10 shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="relative space-y-4">
          <Badge className="bg-accent/50 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Employee Hub
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Welcome to your feedback dashboard.
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
            This is your secure space to shape the company culture. Participate in active discussions, answer recent question campaigns, or submit your own feature requests and concerns anonymously.
          </p>
        </div>
      </div>

      {/* 2. Quick Actions Row */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/submit"
          className="group relative flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card p-6 text-center shadow-sm transition-all hover:border-primary/50 hover:bg-accent/30 hover:shadow-md"
        >
          <div className="rounded-full bg-primary/10 p-3 text-primary transition-transform group-hover:scale-110">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-foreground">Participate</p>
            <p className="mt-1 text-xs text-muted-foreground">Answer campaigns or submit ideas</p>
          </div>
        </Link>
        <Link
          href="/feedback"
          className="group relative flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card p-6 text-center shadow-sm transition-all hover:border-primary/50 hover:bg-accent/30 hover:shadow-md"
        >
          <div className="rounded-full bg-primary/10 p-3 text-primary transition-transform group-hover:scale-110">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-foreground">View Feed</p>
            <p className="mt-1 text-xs text-muted-foreground">Browse trending discussions</p>
          </div>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 3. Active Campaigns Spotlight */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight text-foreground">Live Campaigns</h2>
            <Link href="/submit" className="text-xs font-semibold text-primary hover:underline">
              View all
            </Link>
          </div>
          {liveCampaigns.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground shadow-sm">
              No active campaigns right now.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {liveCampaigns.map((c) => (
                <Link
                  key={c.id}
                  href="/submit"
                  className="group flex flex-col gap-2 rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/50 hover:bg-accent/20 hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="font-semibold leading-none text-foreground group-hover:text-primary transition-colors">
                      {c.title}
                    </h3>
                    <Badge className="shrink-0 bg-accent/50 text-[10px]">
                      {CATEGORY_LABELS[c.category] || c.category}
                    </Badge>
                  </div>
                  {c.description && (
                    <p className="line-clamp-2 text-sm text-muted-foreground">{c.description}</p>
                  )}
                  <p className="text-xs font-medium text-muted-foreground/80 mt-1">
                    {c._count.questions} questions available
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* 4. Trending Feedback */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight text-foreground">Trending This Week</h2>
            <Link href="/feedback" className="text-xs font-semibold text-primary hover:underline">
              Join discussion
            </Link>
          </div>
          {trendingFeedback.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground shadow-sm">
              No recent feedback to display.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {trendingFeedback.map((f) => (
                <Link
                  key={f.id}
                  href="/feedback"
                  className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/50 hover:bg-accent/20 hover:shadow-sm"
                >
                  <p className="line-clamp-2 text-sm font-medium leading-relaxed text-foreground group-hover:text-primary transition-colors">
                    {f.content}
                  </p>
                  <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <svg className="h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z" clipRule="evenodd" />
                      </svg>
                      {f.upvotes}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      {f._count.comments}
                    </span>
                    <span className="ml-auto rounded bg-accent/50 px-2 py-0.5 text-[10px] uppercase tracking-wide">
                      {CATEGORY_LABELS[f.category] || f.category}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

    </section>
  );
}
