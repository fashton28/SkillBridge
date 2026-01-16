import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import {
  quizAttempt,
  quizResponse,
  quizQuestion,
  quizCategory,
  userStudyProgress,
} from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

// POST - Complete a quiz attempt
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { attemptId } = await params;

    // Get the attempt
    const [attempt] = await db
      .select()
      .from(quizAttempt)
      .where(
        and(
          eq(quizAttempt.id, attemptId),
          eq(quizAttempt.userId, session.user.id)
        )
      );

    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    }

    if (attempt.status === "completed") {
      return NextResponse.json(
        { error: "Quiz already completed" },
        { status: 400 }
      );
    }

    // Calculate final score
    const score =
      attempt.totalQuestions > 0
        ? (attempt.correctAnswers / attempt.totalQuestions) * 100
        : 0;

    const durationMs = new Date().getTime() - new Date(attempt.startedAt).getTime();

    // Update attempt status
    await db
      .update(quizAttempt)
      .set({
        status: "completed",
        completedAt: new Date(),
        score,
        durationMs,
      })
      .where(eq(quizAttempt.id, attemptId));

    // Get responses with category info for breakdown
    const responses = await db
      .select({
        isCorrect: quizResponse.isCorrect,
        categoryId: quizQuestion.categoryId,
        categoryName: quizCategory.name,
        parentId: quizCategory.parentId,
      })
      .from(quizResponse)
      .leftJoin(quizQuestion, eq(quizResponse.questionId, quizQuestion.id))
      .leftJoin(quizCategory, eq(quizQuestion.categoryId, quizCategory.id))
      .where(eq(quizResponse.attemptId, attemptId));

    // Calculate category breakdown
    const categoryBreakdown: Record<
      string,
      { name: string; correct: number; total: number }
    > = {};

    for (const r of responses) {
      if (!r.categoryId) continue;

      // Use parent category for grouping if exists
      const categoryKey = r.parentId || r.categoryId;
      const categoryName = r.categoryName || "Unknown";

      if (!categoryBreakdown[categoryKey]) {
        categoryBreakdown[categoryKey] = { name: categoryName, correct: 0, total: 0 };
      }
      categoryBreakdown[categoryKey].total++;
      if (r.isCorrect) {
        categoryBreakdown[categoryKey].correct++;
      }
    }

    // Update user study progress for each category
    for (const [categoryId, stats] of Object.entries(categoryBreakdown)) {
      const [existingProgress] = await db
        .select()
        .from(userStudyProgress)
        .where(
          and(
            eq(userStudyProgress.userId, session.user.id),
            eq(userStudyProgress.categoryId, categoryId),
            eq(userStudyProgress.testVersion, attempt.testVersion)
          )
        );

      if (existingProgress) {
        const newTotalAttempts = existingProgress.totalAttempts + stats.total;
        const newCorrectAttempts = existingProgress.correctAttempts + stats.correct;
        const masteryScore = (newCorrectAttempts / newTotalAttempts) * 100;

        await db
          .update(userStudyProgress)
          .set({
            totalAttempts: newTotalAttempts,
            correctAttempts: newCorrectAttempts,
            masteryScore,
            lastPracticedAt: new Date(),
          })
          .where(eq(userStudyProgress.id, existingProgress.id));
      } else {
        const masteryScore = (stats.correct / stats.total) * 100;
        await db.insert(userStudyProgress).values({
          id: nanoid(),
          userId: session.user.id,
          categoryId,
          testVersion: attempt.testVersion,
          totalAttempts: stats.total,
          correctAttempts: stats.correct,
          masteryScore,
          lastPracticedAt: new Date(),
        });
      }
    }

    return NextResponse.json({
      score,
      correctAnswers: attempt.correctAnswers,
      wrongAnswers: attempt.wrongAnswers,
      totalQuestions: attempt.totalQuestions,
      durationMs,
      passed: score >= 60, // USCIS passing is 6/10 = 60%
      categoryBreakdown: Object.entries(categoryBreakdown).map(([id, stats]) => ({
        categoryId: id,
        categoryName: stats.name,
        correct: stats.correct,
        total: stats.total,
        percentage: (stats.correct / stats.total) * 100,
      })),
    });
  } catch (error) {
    console.error("Error completing quiz:", error);
    return NextResponse.json(
      { error: "Failed to complete quiz" },
      { status: 500 }
    );
  }
}
