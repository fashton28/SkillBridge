import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { quizAttempt, quizResponse, quizQuestion, quizCategory } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// GET - Get a specific quiz attempt with responses
export async function GET(
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
      .select({
        id: quizAttempt.id,
        userId: quizAttempt.userId,
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
      .where(
        and(
          eq(quizAttempt.id, attemptId),
          eq(quizAttempt.userId, session.user.id)
        )
      );

    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    }

    // Get the responses with question details
    const responses = await db
      .select({
        id: quizResponse.id,
        questionId: quizResponse.questionId,
        userAnswer: quizResponse.userAnswer,
        isCorrect: quizResponse.isCorrect,
        answeredAt: quizResponse.answeredAt,
        timeSpentMs: quizResponse.timeSpentMs,
        questionNumber: quizQuestion.questionNumber,
        questionText: quizQuestion.questionText,
        answers: quizQuestion.answers,
        categoryName: quizCategory.name,
      })
      .from(quizResponse)
      .leftJoin(quizQuestion, eq(quizResponse.questionId, quizQuestion.id))
      .leftJoin(quizCategory, eq(quizQuestion.categoryId, quizCategory.id))
      .where(eq(quizResponse.attemptId, attemptId));

    return NextResponse.json({
      attempt,
      responses: responses.map((r) => ({
        id: r.id,
        questionId: r.questionId,
        userAnswer: r.userAnswer,
        isCorrect: r.isCorrect,
        answeredAt: r.answeredAt,
        timeSpentMs: r.timeSpentMs,
        question: {
          questionNumber: r.questionNumber,
          questionText: r.questionText,
          answers: r.answers,
          categoryName: r.categoryName,
        },
      })),
    });
  } catch (error) {
    console.error("Error fetching quiz attempt:", error);
    return NextResponse.json(
      { error: "Failed to fetch quiz attempt" },
      { status: 500 }
    );
  }
}
