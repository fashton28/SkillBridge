import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import {
  userStudyProgress,
  userQuestionStats,
  quizCategory,
  quizQuestion,
} from "@/db/schema";
import { eq, and, sql, asc, lt, inArray } from "drizzle-orm";

// GET - Generate a personalized study plan
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

    // Get all categories with their progress
    const categoriesWithProgress = await db
      .select({
        categoryId: quizCategory.id,
        categoryName: quizCategory.name,
        categorySlug: quizCategory.slug,
        parentId: quizCategory.parentId,
        totalAttempts: sql<number>`COALESCE(${userStudyProgress.totalAttempts}, 0)`,
        correctAttempts: sql<number>`COALESCE(${userStudyProgress.correctAttempts}, 0)`,
        masteryScore: sql<number>`COALESCE(${userStudyProgress.masteryScore}, 0)`,
        lastPracticedAt: userStudyProgress.lastPracticedAt,
        totalQuestions: sql<number>`(
          SELECT COUNT(*) FROM quiz_question
          WHERE quiz_question.category_id = quiz_category.id
          AND quiz_question.test_version = ${testVersion}
        )`,
      })
      .from(quizCategory)
      .leftJoin(
        userStudyProgress,
        and(
          eq(userStudyProgress.categoryId, quizCategory.id),
          eq(userStudyProgress.userId, session.user.id),
          eq(userStudyProgress.testVersion, testVersion)
        )
      )
      .where(sql`quiz_category.parent_id IS NOT NULL`) // Only subcategories
      .orderBy(asc(sql`COALESCE(${userStudyProgress.masteryScore}, 0)`));

    // Identify weak categories (mastery < 70%)
    const weakCategories = categoriesWithProgress
      .filter((c) => Number(c.masteryScore) < 70 && Number(c.totalQuestions) > 0)
      .map((c) => ({
        categoryId: c.categoryId,
        categoryName: c.categoryName,
        categorySlug: c.categorySlug,
        totalQuestions: Number(c.totalQuestions),
        attemptedQuestions: Number(c.totalAttempts),
        correctAnswers: Number(c.correctAttempts),
        masteryScore: Number(c.masteryScore),
        lastPracticedAt: c.lastPracticedAt,
      }));

    // Get questions the user struggles with
    const weakQuestionIds = await db
      .select({
        questionId: userQuestionStats.questionId,
      })
      .from(userQuestionStats)
      .where(
        and(
          eq(userQuestionStats.userId, session.user.id),
          sql`${userQuestionStats.timesAttempted} >= 2`,
          sql`CAST(${userQuestionStats.timesCorrect} AS FLOAT) / CAST(${userQuestionStats.timesAttempted} AS FLOAT) < 0.6`
        )
      );

    // Get weak category IDs
    const weakCategoryIds = weakCategories.map((c) => c.categoryId);

    // Get recommended questions
    let recommendedQuestions: {
      id: string;
      questionNumber: number;
      questionText: string;
      categoryName: string | null;
    }[] = [];

    if (weakQuestionIds.length > 0) {
      // Priority 1: Questions user got wrong
      recommendedQuestions = await db
        .select({
          id: quizQuestion.id,
          questionNumber: quizQuestion.questionNumber,
          questionText: quizQuestion.questionText,
          categoryName: quizCategory.name,
        })
        .from(quizQuestion)
        .leftJoin(quizCategory, eq(quizQuestion.categoryId, quizCategory.id))
        .where(
          and(
            eq(quizQuestion.testVersion, testVersion),
            inArray(
              quizQuestion.id,
              weakQuestionIds.map((q) => q.questionId)
            )
          )
        )
        .limit(10);
    }

    // Priority 2: Questions from weak categories
    if (recommendedQuestions.length < 10 && weakCategoryIds.length > 0) {
      const additionalQuestions = await db
        .select({
          id: quizQuestion.id,
          questionNumber: quizQuestion.questionNumber,
          questionText: quizQuestion.questionText,
          categoryName: quizCategory.name,
        })
        .from(quizQuestion)
        .leftJoin(quizCategory, eq(quizQuestion.categoryId, quizCategory.id))
        .where(
          and(
            eq(quizQuestion.testVersion, testVersion),
            inArray(quizQuestion.categoryId, weakCategoryIds)
          )
        )
        .orderBy(sql`RANDOM()`)
        .limit(10 - recommendedQuestions.length);

      recommendedQuestions = [...recommendedQuestions, ...additionalQuestions];
    }

    // Priority 3: Random unattempted questions
    if (recommendedQuestions.length < 10) {
      const attemptedQuestionIds = await db
        .select({ questionId: userQuestionStats.questionId })
        .from(userQuestionStats)
        .where(eq(userQuestionStats.userId, session.user.id));

      const unattemptedQuestions = await db
        .select({
          id: quizQuestion.id,
          questionNumber: quizQuestion.questionNumber,
          questionText: quizQuestion.questionText,
          categoryName: quizCategory.name,
        })
        .from(quizQuestion)
        .leftJoin(quizCategory, eq(quizQuestion.categoryId, quizCategory.id))
        .where(
          and(
            eq(quizQuestion.testVersion, testVersion),
            attemptedQuestionIds.length > 0
              ? sql`${quizQuestion.id} NOT IN (${sql.join(
                  attemptedQuestionIds.map((q) => sql`${q.questionId}`),
                  sql`, `
                )})`
              : sql`1=1`
          )
        )
        .orderBy(sql`RANDOM()`)
        .limit(10 - recommendedQuestions.length);

      recommendedQuestions = [...recommendedQuestions, ...unattemptedQuestions];
    }

    // Calculate overall progress and goals
    const totalWeakQuestions = weakCategories.reduce(
      (sum, c) => sum + c.totalQuestions,
      0
    );
    const dailyGoal = Math.min(10, Math.max(5, Math.ceil(totalWeakQuestions / 7)));

    // Calculate overall progress
    const [progressStats] = await db
      .select({
        totalAttempted: sql<number>`COALESCE(SUM(${userStudyProgress.totalAttempts}), 0)`,
        totalCorrect: sql<number>`COALESCE(SUM(${userStudyProgress.correctAttempts}), 0)`,
      })
      .from(userStudyProgress)
      .where(
        and(
          eq(userStudyProgress.userId, session.user.id),
          eq(userStudyProgress.testVersion, testVersion)
        )
      );

    const overallProgress =
      Number(progressStats.totalAttempted) > 0
        ? (Number(progressStats.totalCorrect) / Number(progressStats.totalAttempted)) * 100
        : 0;

    // Determine next milestone
    let nextMilestone: string;
    if (overallProgress < 25) {
      nextMilestone = "Complete 25% of all questions";
    } else if (overallProgress < 50) {
      nextMilestone = "Reach 50% overall mastery";
    } else if (overallProgress < 60) {
      nextMilestone = "Pass the practice threshold (60%)";
    } else if (overallProgress < 80) {
      nextMilestone = "Achieve proficiency (80%)";
    } else if (overallProgress < 95) {
      nextMilestone = "Near perfect mastery (95%)";
    } else {
      nextMilestone = "Maintain your excellent score!";
    }

    // Estimate time to mastery
    const estimatedDays = Math.ceil(totalWeakQuestions / dailyGoal);
    const estimatedTimeToMastery =
      estimatedDays <= 7
        ? `${estimatedDays} days`
        : `${Math.ceil(estimatedDays / 7)} weeks`;

    return NextResponse.json({
      weakCategories,
      recommendedQuestions,
      dailyGoal,
      estimatedTimeToMastery,
      nextMilestone,
      overallProgress: Math.round(overallProgress * 10) / 10,
    });
  } catch (error) {
    console.error("Error generating study plan:", error);
    return NextResponse.json(
      { error: "Failed to generate study plan" },
      { status: 500 }
    );
  }
}
