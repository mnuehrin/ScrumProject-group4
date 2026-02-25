import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

function escapeCsvField(value: string): string {
  const s = String(value ?? "");
  if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [feedbackRows, campaigns] = await Promise.all([
    prisma.feedback.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { comments: true } } },
    }),
    prisma.campaign.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        questions: {
          orderBy: { createdAt: "desc" },
          include: { _count: { select: { responses: true } } },
        },
      },
    }),
  ]);

  const feedbackExport = feedbackRows.map((f) => ({
    id: f.id,
    type: "feedback",
    content: f.content,
    category: f.category,
    status: f.status,
    createdAt: f.createdAt.toISOString(),
    upvotes: f.upvotes,
    commentsCount: f._count.comments,
    adminNote: f.adminNote ?? "",
  }));

  const campaignExport: Array<{
    id: string;
    type: string;
    content: string;
    category: string;
    status: string;
    createdAt: string;
    upvotes: number;
    commentsCount: number;
    adminNote: string;
  }> = [];
  for (const c of campaigns) {
    const status = c.status === "LIVE" ? "IN_PROGRESS" : c.status === "ARCHIVED" ? "RESOLVED" : "PENDING";
    for (const q of c.questions) {
      campaignExport.push({
        id: `campaign-question-${q.id}`,
        type: "campaign",
        content: q.prompt,
        category: c.category,
        status,
        createdAt: q.createdAt.toISOString(),
        upvotes: q._count.responses,
        commentsCount: q._count.responses,
        adminNote: `Campaign: ${c.title}`,
      });
    }
  }

  const allRows = [...feedbackExport, ...campaignExport].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const headers = [
    "id",
    "type",
    "content",
    "category",
    "status",
    "createdAt",
    "upvotes",
    "commentsCount",
    "adminNote",
  ];
  const csvLines = [
    headers.join(","),
    ...allRows.map((row) =>
      headers
        .map((h) => escapeCsvField((row as Record<string, string | number>)[h] as string))
        .join(",")
    ),
  ];
  const csv = csvLines.join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="feedback-export.csv"',
    },
  });
}
