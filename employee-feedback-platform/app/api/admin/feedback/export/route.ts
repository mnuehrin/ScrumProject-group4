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

  const feedbackRows = await prisma.feedback.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { comments: true } } },
  });

  const allRows = feedbackRows.map((f) => ({
    id: f.id,
    content: f.content,
    category: f.category,
    status: f.status,
    createdAt: f.createdAt.toISOString(),
    upvotes: f.upvotes,
    commentsCount: f._count.comments,
    adminNote: f.adminNote ?? "",
  }));

  const headers = [
    "id",
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
