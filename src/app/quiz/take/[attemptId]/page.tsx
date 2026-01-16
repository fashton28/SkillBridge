"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { QuestionCard } from "@/components/quiz/QuestionCard";
import { ArrowLeft, Loader2 } from "lucide-react";

interface Question {
  id: string;
  questionNumber: number;
  questionText: string;
  category?: {
    id: string;
    name: string | null;
  };
}

export default function QuizTakePage() {
  const params = useParams();
  const router = useRouter();
  const attemptId = params.attemptId as string;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<string>>(new Set());

  // Fetch attempt details
  const { data: attemptData, isLoading: isAttemptLoading } = useQuery({
    queryKey: ["quiz-attempt", attemptId],
    queryFn: async () => {
      const res = await fetch(`/api/quiz/attempt/${attemptId}`);
      if (!res.ok) throw new Error("Failed to fetch attempt");
      return res.json();
    },
  });

  // If we have attempt data but no questions loaded yet, fetch them
  useEffect(() => {
    if (attemptData?.attempt?.status === "completed") {
      router.replace(`/quiz/results/${attemptId}`);
      return;
    }

    // Load questions from responses if available
    if (attemptData?.responses) {
      const answeredIds = new Set<string>(
        attemptData.responses.map((r: { questionId: string }) => r.questionId)
      );
      setAnsweredQuestions(answeredIds);

      // If all questions answered, redirect to results
      if (answeredIds.size >= (attemptData.attempt?.totalQuestions || 0)) {
        router.replace(`/quiz/results/${attemptId}`);
      }
    }
  }, [attemptData, attemptId, router]);

  // Fetch questions for this attempt
  const { data: questionsData, isLoading: isQuestionsLoading } = useQuery({
    queryKey: ["quiz-questions-for-attempt", attemptId],
    queryFn: async () => {
      // Get attempt to know question count and filters
      const res = await fetch(`/api/quiz/questions?testVersion=${attemptData?.attempt?.testVersion || "2008"}&limit=${attemptData?.attempt?.totalQuestions || 10}&random=true`);
      if (!res.ok) throw new Error("Failed to fetch questions");
      return res.json();
    },
    enabled: !!attemptData?.attempt && questions.length === 0,
  });

  useEffect(() => {
    if (questionsData?.questions && questions.length === 0) {
      setQuestions(questionsData.questions);
    }
  }, [questionsData, questions.length]);

  // Submit answer mutation
  const submitAnswer = useMutation({
    mutationFn: async ({ questionId, answer }: { questionId: string; answer: string }) => {
      const res = await fetch(`/api/quiz/attempt/${attemptId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId,
          userAnswer: answer,
        }),
      });
      if (!res.ok) throw new Error("Failed to submit answer");
      return res.json();
    },
    onSuccess: (_, variables) => {
      setAnsweredQuestions((prev) => new Set(prev).add(variables.questionId));
    },
  });

  // Complete quiz mutation
  const completeQuiz = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/quiz/attempt/${attemptId}/complete`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to complete quiz");
      return res.json();
    },
    onSuccess: () => {
      router.push(`/quiz/results/${attemptId}`);
    },
  });

  const handleSubmitAnswer = async (answer: string) => {
    const question = questions[currentIndex];
    if (!question) return { isCorrect: false, correctAnswers: [], matchedAnswer: null };

    const result = await submitAnswer.mutateAsync({
      questionId: question.id,
      answer,
    });

    return {
      isCorrect: result.isCorrect,
      correctAnswers: result.correctAnswers,
      matchedAnswer: result.matchedAnswer,
    };
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // All questions answered, complete the quiz
      completeQuiz.mutate();
    }
  };

  const handleBack = () => {
    router.push("/quiz");
  };

  if (isAttemptLoading || isQuestionsLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">No questions available</p>
          <Button onClick={handleBack}>Go Back</Button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Exit Quiz
          </Button>
          <div className="text-sm text-muted-foreground">
            {answeredQuestions.size} of {questions.length} answered
          </div>
        </div>
      </div>

      {/* Quiz Content */}
      <div className="flex-1 overflow-auto container mx-auto px-4 py-8">
        {currentQuestion && (
          <QuestionCard
            question={currentQuestion}
            currentIndex={currentIndex}
            totalQuestions={questions.length}
            onSubmit={handleSubmitAnswer}
            onNext={handleNext}
            isLast={currentIndex === questions.length - 1}
          />
        )}
      </div>

      {/* Loading overlay for completing quiz */}
      {completeQuiz.isPending && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Calculating results...</p>
          </div>
        </div>
      )}
    </div>
  );
}
