import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * GET /api/admin/migrate/link-questions
 *
 * One-time admin endpoint that creates linked Feedback records for any
 * Questions that were created before the creation API was fixed.
 * Safe to run multiple times — it only processes orphaned questions.
 */
export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find questions with no linked Feedback record
    const orphaned = await prisma.question.findMany({
        where: { feedback: { is: null } },
        include: {
            campaign: { select: { title: true, category: true, status: true } },
        },
    });

    if (orphaned.length === 0) {
        return NextResponse.json({ message: "All questions already linked. Nothing to do.", linked: 0 });
    }

    const statusMap = {
        LIVE: "IN_PROGRESS",
        ARCHIVED: "RESOLVED",
        DRAFT: "PENDING",
    } as const;

    await prisma.$transaction(
        orphaned.map((q) =>
            prisma.feedback.create({
                data: {
                    content: q.prompt,
                    category: q.campaign.category,
                    status: statusMap[q.campaign.status] ?? "PENDING",
                    questionId: q.id,
                    adminNote: `Campaign: ${q.campaign.title}`,
                    upvotes: q.upvotes ?? 0,
                    downvotes: q.downvotes ?? 0,
                    createdAt: q.createdAt,
                },
            })
        )
    );

    return NextResponse.json({
        message: `Linked ${orphaned.length} question(s) to new Feedback records.`,
        linked: orphaned.length,
    });
}
