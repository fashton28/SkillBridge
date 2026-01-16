import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { quizAttempt, quizCategory } from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

// GET - Get user's quiz history
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const testVersion = searchParams.get("testVersion");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    const conditions = [eq(quizAttempt.userId, session.user.id)];
    if (testVersion) {
      conditions.push(eq(quizAttempt.testVersion, testVersion));
    }

    const attempts = await db
      .select({
        id: quizAttempt.id,
        testVersion: quizAttempt.testVersion,
        quizType: quizAttempt.quizType,
        categoryId: quizAttempt.categoryId,
        totalQuestions: quizAttempt.totalQuestions,
        correctAnswers: quizAttempt.correctAnswers,
        wrongAnswers: quizAttempt.wrongAnswers,
        score: quizAttempt.score,
        status: quizAttempt.status,
        startedAt: quizAttempt.startedAt,
        completedAt: quizAttempt.completedAt,
        durationMs: quizAttempt.durationMs,
        categoryName: quizCategory.name,
      })
      .from(quizAttempt)
      .leftJoin(quizCategory, eq(quizAttempt.categoryId, quizCategory.id))
      .where(and(...conditions))
      .orderBy(desc(quizAttempt.startedAt))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(quizAttempt)
      .where(and(...conditions));

    // Calculate aggregate stats
    const [stats] = await db
      .select({
        totalQuizzes: sql<number>`COUNT(*)`,
        avgScore: sql<number>`AVG(${quizAttempt.score})`,
        passedCount: sql<number>`SUM(CASE WHEN ${quizAttempt.score} >= 60 THEN 1 ELSE 0 END)`,
        totalQuestions: sql<number>`SUM(${quizAttempt.totalQuestions})`,
        totalCorrect: sql<number>`SUM(${quizAttempt.correctAnswers})`,
      })
      .from(quizAttempt)
      .where(
        and(
          eq(quizAttempt.userId, session.user.id),
          eq(quizAttempt.status, "completed"),
          ...(testVersion ? [eq(quizAttempt.testVersion, testVersion)] : [])
        )
      );

    return NextResponse.json({
      attempts,
      total: Number(count),
      limit,
      offset,
      stats: {
        totalQuizzes: Number(stats.totalQuizzes),
        avgScore: Math.round(Number(stats.avgScore || 0) * 10) / 10,
        passRate:
          Number(stats.totalQuizzes) > 0
            ? Math.round(
                (Number(stats.passedCount) / Number(stats.totalQuizzes)) * 100
              )
            : 0,
        totalQuestions: Number(stats.totalQuestions),
        totalCorrect: Number(stats.totalCorrect),
      },
    });
  } catch (error) {
    console.error("Error fetching quiz history:", error);
    return NextResponse.json(
      { error: "Failed to fetch quiz history" },
      { status: 500 }
    );
  }
}
