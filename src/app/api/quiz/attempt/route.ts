import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { quizAttempt, quizQuestion, quizCategory } from "@/db/schema";
import { eq, and, sql, inArray, desc } from "drizzle-orm";
import { nanoid } from "nanoid";

// POST - Create a new quiz attempt
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      testVersion = "2008",
      quizType = "full",
      categoryId,
      questionCount = 10,
    } = body;

    // Build query conditions
    const conditions = [eq(quizQuestion.testVersion, testVersion)];

    if (categoryId && quizType === "category") {
      // Get category and its children
      const categoryWithChildren = await db
        .select({ id: quizCategory.id })
        .from(quizCategory)
        .where(
          sql`${quizCategory.id} = ${categoryId} OR ${quizCategory.parentId} = ${categoryId}`
        );

      const categoryIds = categoryWithChildren.map((c) => c.id);
      if (categoryIds.length > 0) {
        conditions.push(inArray(quizQuestion.categoryId, categoryIds));
      }
    }

    // Get random questions for the quiz
    const questions = await db
      .select({
        id: quizQuestion.id,
        categoryId: quizQuestion.categoryId,
        questionNumber: quizQuestion.questionNumber,
        questionText: quizQuestion.questionText,
        testVersion: quizQuestion.testVersion,
        difficulty: quizQuestion.difficulty,
        categoryName: quizCategory.name,
      })
      .from(quizQuestion)
      .leftJoin(quizCategory, eq(quizQuestion.categoryId, quizCategory.id))
      .where(and(...conditions))
      .orderBy(sql`RANDOM()`)
      .limit(questionCount);

    if (questions.length === 0) {
      return NextResponse.json(
        { error: "No questions found for the selected criteria" },
        { status: 400 }
      );
    }

    // Create the quiz attempt
    const attemptId = nanoid();
    await db.insert(quizAttempt).values({
      id: attemptId,
      userId: session.user.id,
      testVersion,
      quizType,
      categoryId: categoryId || null,
      totalQuestions: questions.length,
      correctAnswers: 0,
      wrongAnswers: 0,
      status: "in_progress",
      startedAt: new Date(),
    });

    return NextResponse.json({
      attemptId,
      questions: questions.map((q) => ({
        id: q.id,
        questionNumber: q.questionNumber,
        questionText: q.questionText,
        category: {
          id: q.categoryId,
          name: q.categoryName,
        },
      })),
      totalQuestions: questions.length,
    });
  } catch (error) {
    console.error("Error creating quiz attempt:", error);
    return NextResponse.json(
      { error: "Failed to create quiz attempt" },
      { status: 500 }
    );
  }
}

// GET - Get user's quiz attempts
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = parseInt(searchParams.get("offset") || "0");

    const conditions = [eq(quizAttempt.userId, session.user.id)];
    if (status) {
      conditions.push(eq(quizAttempt.status, status));
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

    return NextResponse.json({
      attempts,
      total: Number(count),
      limit,
      offset,
    });
  } catch (error) {
    console.error("Error fetching quiz attempts:", error);
    return NextResponse.json(
      { error: "Failed to fetch quiz attempts" },
      { status: 500 }
    );
  }
}
