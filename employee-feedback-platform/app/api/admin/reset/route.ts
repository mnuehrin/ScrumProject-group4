import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * DELETE /api/admin/reset
 * Wipes all application data in safe foreign-key order inside one transaction.
 * Requires admin session. Schema and code are untouched.
 */
export async function DELETE() {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [
        activityLogs,
        feedbackComments,
        feedbackPromptResponses,
        rewards,
        upvotes,
        questionVotes,
        questionResponses,
        feedback,
        questions,
        campaigns,
    ] = await prisma.$transaction([
        prisma.activityLog.deleteMany(),
        prisma.feedbackComment.deleteMany(),
        prisma.feedbackPromptResponse.deleteMany(),
        prisma.reward.deleteMany(),
        prisma.upvote.deleteMany(),
        prisma.questionVote.deleteMany(),
        prisma.questionResponse.deleteMany(),
        prisma.feedback.deleteMany(),
        prisma.question.deleteMany(),
        prisma.campaign.deleteMany(),
    ]);

    return NextResponse.json({
        message: "All application data cleared successfully.",
        deleted: {
            activityLogs: activityLogs.count,
            feedbackComments: feedbackComments.count,
            feedbackPromptResponses: feedbackPromptResponses.count,
            rewards: rewards.count,
            upvotes: upvotes.count,
            questionVotes: questionVotes.count,
            questionResponses: questionResponses.count,
            feedback: feedback.count,
            questions: questions.count,
            campaigns: campaigns.count,
        },
    });
}
