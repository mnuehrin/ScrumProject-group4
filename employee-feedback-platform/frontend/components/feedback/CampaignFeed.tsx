import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

type CampaignFeedItem = {
  id: string;
  title: string;
  description: string | null;
  category: "CULTURE" | "TOOLS" | "WORKLOAD" | "MANAGEMENT" | "OTHER";
  questions: {
    id: string;
    prompt: string;
    responses: {
      id: string;
      content: string;
      createdAt: Date;
      authorLabel: string;
    }[];
  }[];
};

const CATEGORY_LABELS: Record<CampaignFeedItem["category"], string> = {
  CULTURE: "Culture",
  TOOLS: "Tools",
  WORKLOAD: "Workload",
  MANAGEMENT: "Management",
  OTHER: "Other",
};

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function CampaignFeed({ campaigns }: { campaigns: CampaignFeedItem[] }) {
  if (campaigns.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white px-5 py-5 sm:px-6">
        <h2 className="text-lg font-semibold text-slate-900">Admin questions</h2>
        <p className="mt-1 text-sm text-slate-600">
          Live campaigns with responses from your teammates.
        </p>
      </div>

      <div className="space-y-3">
        {campaigns.map((campaign) => (
          <Card key={campaign.id}>
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <Badge>{CATEGORY_LABELS[campaign.category]}</Badge>
                <span className="text-xs text-slate-400">Campaign</span>
              </div>
              <h3 className="text-base font-semibold text-slate-900">{campaign.title}</h3>
              {campaign.description && (
                <p className="text-sm text-slate-600">{campaign.description}</p>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {campaign.questions.map((question) => (
                <div key={question.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-medium text-slate-900">{question.prompt}</p>
                  {question.responses.length === 0 ? (
                    <p className="mt-2 text-xs text-slate-400">No responses yet.</p>
                  ) : (
                    <ul className="mt-3 space-y-3">
                      {question.responses.map((response) => (
                        <li key={response.id} className="rounded-md border border-slate-200 bg-white p-3">
                          <div className="text-[11px] text-slate-500">
                            {response.authorLabel} · {formatDate(response.createdAt)}
                          </div>
                          <p className="mt-1 text-sm text-slate-700 whitespace-pre-wrap">
                            {response.content}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
