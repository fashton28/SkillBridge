import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import {
  quizAttempt,
  quizResponse,
  quizQuestion,
  userQuestionStats,
} from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { validateAnswer } from "@/lib/quiz-validation";

// POST - Submit an answer for a question
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
    const body = await request.json();
    const { questionId, userAnswer, timeSpentMs } = body;

    if (!questionId || !userAnswer) {
      return NextResponse.json(
        { error: "Missing questionId or userAnswer" },
        { status: 400 }
      );
    }

    // Verify the attempt belongs to the user and is in progress
    const [attempt] = await db
      .select()
      .from(quizAttempt)
      .where(
        and(
          eq(quizAttempt.id, attemptId),
          eq(quizAttempt.userId, session.user.id),
          eq(quizAttempt.status, "in_progress")
        )
      );

    if (!attempt) {
      return NextResponse.json(
        { error: "Attempt not found or already completed" },
        { status: 404 }
      );
    }

    // Check if already answered this question
    const [existingResponse] = await db
      .select()
      .from(quizResponse)
      .where(
        and(
          eq(quizResponse.attemptId, attemptId),
          eq(quizResponse.questionId, questionId)
        )
      );

    if (existingResponse) {
      return NextResponse.json(
        { error: "Question already answered" },
        { status: 400 }
      );
    }

    // Get the question to validate the answer
    const [question] = await db
      .select()
      .from(quizQuestion)
      .where(eq(quizQuestion.id, questionId));

    if (!question) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }

    // Validate the answer
    const { isCorrect, matchedAnswer } = validateAnswer(
      userAnswer,
      question.answers as string[]
    );

    // Record the response
    await db.insert(quizResponse).values({
      id: nanoid(),
      attemptId,
      questionId,
      userAnswer,
      isCorrect,
      answeredAt: new Date(),
      timeSpentMs: timeSpentMs || null,
    });

    // Update attempt stats
    if (isCorrect) {
      await db
        .update(quizAttempt)
        .set({
          correctAnswers: sql`${quizAttempt.correctAnswers} + 1`,
        })
        .where(eq(quizAttempt.id, attemptId));
    } else {
      await db
        .update(quizAttempt)
        .set({
          wrongAnswers: sql`${quizAttempt.wrongAnswers} + 1`,
        })
        .where(eq(quizAttempt.id, attemptId));
    }

    // Update user question stats
    const [existingStats] = await db
      .select()
      .from(userQuestionStats)
      .where(
        and(
          eq(userQuestionStats.userId, session.user.id),
          eq(userQuestionStats.questionId, questionId)
        )
      );

    if (existingStats) {
      await db
        .update(userQuestionStats)
        .set({
          timesAttempted: sql`${userQuestionStats.timesAttempted} + 1`,
          timesCorrect: isCorrect
            ? sql`${userQuestionStats.timesCorrect} + 1`
            : userQuestionStats.timesCorrect,
          lastAttemptedAt: new Date(),
          lastCorrectAt: isCorrect ? new Date() : existingStats.lastCorrectAt,
          streak: isCorrect ? sql`${userQuestionStats.streak} + 1` : 0,
        })
        .where(eq(userQuestionStats.id, existingStats.id));
    } else {
      await db.insert(userQuestionStats).values({
        id: nanoid(),
        userId: session.user.id,
        questionId,
        timesAttempted: 1,
        timesCorrect: isCorrect ? 1 : 0,
        lastAttemptedAt: new Date(),
        lastCorrectAt: isCorrect ? new Date() : null,
        streak: isCorrect ? 1 : 0,
      });
    }

    return NextResponse.json({
      isCorrect,
      userAnswer,
      correctAnswers: question.answers,
      matchedAnswer,
      explanation: question.explanation,
    });
  } catch (error) {
    console.error("Error submitting answer:", error);
    return NextResponse.json(
      { error: "Failed to submit answer" },
      { status: 500 }
    );
  }
}
