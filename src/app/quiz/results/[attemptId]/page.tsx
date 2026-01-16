"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Trophy,
  XCircle,
  CheckCircle2,
  ArrowLeft,
  RotateCcw,
  Home,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useState } from "react";

export default function QuizResultsPage() {
  const params = useParams();
  const router = useRouter();
  const attemptId = params.attemptId as string;
  const [showAllResponses, setShowAllResponses] = useState(false);

  // Fetch attempt details with responses
  const { data, isLoading } = useQuery({
    queryKey: ["quiz-results", attemptId],
    queryFn: async () => {
      const res = await fetch(`/api/quiz/attempt/${attemptId}`);
      if (!res.ok) throw new Error("Failed to fetch results");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Skeleton className="h-8 w-48 mb-8" />
          <div className="space-y-4">
            <Skeleton className="h-48" />
            <Skeleton className="h-32" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    );
  }

  const attempt = data?.attempt;
  const responses = data?.responses || [];

  if (!attempt) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Results not found</p>
          <Button onClick={() => router.push("/quiz")}>Go Back</Button>
        </div>
      </div>
    );
  }

  const score = attempt.score || 0;
  const passed = score >= 60;
  const correctAnswers = attempt.correctAnswers || 0;
  const totalQuestions = attempt.totalQuestions || 0;
  const wrongAnswers = totalQuestions - correctAnswers;

  // Group responses by correct/incorrect
  const correctResponses = responses.filter((r: { isCorrect: boolean }) => r.isCorrect);
  const incorrectResponses = responses.filter((r: { isCorrect: boolean }) => !r.isCorrect);

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => router.push("/quiz")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Quiz
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto container mx-auto px-4 py-8 max-w-4xl">
        {/* Score Card */}
        <Card className={`mb-8 ${passed ? "border-green-500/50" : "border-red-500/50"}`}>
          <CardContent className="pt-8 pb-8">
            <div className="text-center">
              {/* Score Circle */}
              <div
                className={`inline-flex items-center justify-center w-32 h-32 rounded-full mb-6 ${
                  passed ? "bg-green-500/10" : "bg-red-500/10"
                }`}
              >
                {passed ? (
                  <Trophy className="h-16 w-16 text-green-500" />
                ) : (
                  <XCircle className="h-16 w-16 text-red-500" />
                )}
              </div>

              <h1 className="text-4xl font-bold mb-2">{Math.round(score)}%</h1>
              <Badge
                variant={passed ? "default" : "destructive"}
                className="text-lg px-4 py-1"
              >
                {passed ? "PASSED" : "NEEDS MORE PRACTICE"}
              </Badge>

              <div className="mt-6 flex items-center justify-center gap-8 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span>
                    <strong>{correctAnswers}</strong> correct
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-500" />
                  <span>
                    <strong>{wrongAnswers}</strong> incorrect
                  </span>
                </div>
              </div>

              {attempt.durationMs && (
                <p className="mt-4 text-muted-foreground">
                  Completed in {formatDuration(attempt.durationMs)}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Progress Bar */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Score Breakdown</CardTitle>
            <CardDescription>
              You need 60% to pass the USCIS civics test
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Progress value={score} className="h-4" />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>0%</span>
                <span className="text-yellow-500 font-medium">60% (Passing)</span>
                <span>100%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Question Review */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Review Answers</CardTitle>
                <CardDescription>
                  {incorrectResponses.length > 0
                    ? `Focus on the ${incorrectResponses.length} question${incorrectResponses.length > 1 ? "s" : ""} you missed`
                    : "Perfect score! All answers correct."}
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllResponses(!showAllResponses)}
              >
                {showAllResponses ? (
                  <>
                    Hide Details
                    <ChevronUp className="h-4 w-4 ml-1" />
                  </>
                ) : (
                  <>
                    Show All
                    <ChevronDown className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Incorrect answers first */}
              {incorrectResponses.map((response: {
                id: string;
                userAnswer: string;
                isCorrect: boolean;
                question: {
                  questionNumber: number;
                  questionText: string;
                  answers: string[];
                  categoryName: string | null;
                };
              }) => (
                <div
                  key={response.id}
                  className="p-4 rounded-lg border border-red-500/20 bg-red-500/5"
                >
                  <div className="flex items-start gap-3">
                    <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">
                          #{response.question.questionNumber}
                        </span>
                        {response.question.categoryName && (
                          <Badge variant="outline" className="text-xs">
                            {response.question.categoryName}
                          </Badge>
                        )}
                      </div>
                      <p className="font-medium mb-2">
                        {response.question.questionText}
                      </p>
                      <div className="text-sm space-y-1">
                        <p className="text-red-500">
                          Your answer: {response.userAnswer}
                        </p>
                        <p className="text-green-600">
                          Correct answer(s): {response.question.answers.join(", ")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Correct answers (shown when expanded) */}
              {showAllResponses &&
                correctResponses.map((response: {
                  id: string;
                  userAnswer: string;
                  isCorrect: boolean;
                  question: {
                    questionNumber: number;
                    questionText: string;
                    answers: string[];
                    categoryName: string | null;
                  };
                }) => (
                  <div
                    key={response.id}
                    className="p-4 rounded-lg border border-green-500/20 bg-green-500/5"
                  >
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">
                            #{response.question.questionNumber}
                          </span>
                          {response.question.categoryName && (
                            <Badge variant="outline" className="text-xs">
                              {response.question.categoryName}
                            </Badge>
                          )}
                        </div>
                        <p className="font-medium mb-2">
                          {response.question.questionText}
                        </p>
                        <p className="text-sm text-green-600">
                          Your answer: {response.userAnswer}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            variant="outline"
            size="lg"
            onClick={() => router.push("/quiz")}
          >
            <Home className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <Button
            size="lg"
            onClick={() => {
              router.push("/quiz");
              // Could trigger new quiz directly here
            }}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Take Another Quiz
          </Button>
        </div>
      </div>
    </div>
  );
}
