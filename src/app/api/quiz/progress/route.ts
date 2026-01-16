import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import {
  userStudyProgress,
  quizCategory,
  quizAttempt,
  quizQuestion,
} from "@/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";

// GET - Get user's study progress across categories
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const testVersion = searchParams.get("testVersion") || "2008";

    // Get progress by category
    const progress = await db
      .select({
        id: userStudyProgress.id,
        categoryId: userStudyProgress.categoryId,
        testVersion: userStudyProgress.testVersion,
        totalAttempts: userStudyProgress.totalAttempts,
        correctAttempts: userStudyProgress.correctAttempts,
        masteryScore: userStudyProgress.masteryScore,
        lastPracticedAt: userStudyProgress.lastPracticedAt,
        categoryName: quizCategory.name,
        categorySlug: quizCategory.slug,
        parentId: quizCategory.parentId,
      })
      .from(userStudyProgress)
      .leftJoin(quizCategory, eq(userStudyProgress.categoryId, quizCategory.id))
      .where(
        and(
          eq(userStudyProgress.userId, session.user.id),
          eq(userStudyProgress.testVersion, testVersion)
        )
      )
      .orderBy(desc(userStudyProgress.masteryScore));

    // Get overall stats
    const [stats] = await db
      .select({
        totalAttempts: sql<number>`COALESCE(SUM(${userStudyProgress.totalAttempts}), 0)`,
        totalCorrect: sql<number>`COALESCE(SUM(${userStudyProgress.correctAttempts}), 0)`,
      })
      .from(userStudyProgress)
      .where(
        and(
          eq(userStudyProgress.userId, session.user.id),
          eq(userStudyProgress.testVersion, testVersion)
        )
      );

    // Get total questions available
    const [questionStats] = await db
      .select({
        totalQuestions: sql<number>`COUNT(*)`,
      })
      .from(quizQuestion)
      .where(eq(quizQuestion.testVersion, testVersion));

    // Get completed quiz count
    const [quizStats] = await db
      .select({
        completedQuizzes: sql<number>`COUNT(*)`,
      })
      .from(quizAttempt)
      .where(
        and(
          eq(quizAttempt.userId, session.user.id),
          eq(quizAttempt.testVersion, testVersion),
          eq(quizAttempt.status, "completed")
        )
      );

    const overallMastery =
      Number(stats.totalAttempts) > 0
        ? (Number(stats.totalCorrect) / Number(stats.totalAttempts)) * 100
        : 0;

    return NextResponse.json({
      progress,
      stats: {
        totalAttempts: Number(stats.totalAttempts),
        totalCorrect: Number(stats.totalCorrect),
        totalQuestions: Number(questionStats.totalQuestions),
        completedQuizzes: Number(quizStats.completedQuizzes),
        overallMastery: Math.round(overallMastery * 10) / 10,
      },
    });
  } catch (error) {
    console.error("Error fetching progress:", error);
    return NextResponse.json(
      { error: "Failed to fetch progress" },
      { status: 500 }
    );
  }
}
