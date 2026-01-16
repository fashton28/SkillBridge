"use client";

import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, ArrowRight, Loader2 } from "lucide-react";

interface QuestionCardProps {
  question: {
    id: string;
    questionNumber: number;
    questionText: string;
    category?: {
      id: string;
      name: string | null;
    };
  };
  currentIndex: number;
  totalQuestions: number;
  onSubmit: (answer: string) => Promise<{
    isCorrect: boolean;
    correctAnswers: string[];
    matchedAnswer: string | null;
  }>;
  onNext: () => void;
  isLast: boolean;
}

export function QuestionCard({
  question,
  currentIndex,
  totalQuestions,
  onSubmit,
  onNext,
  isLast,
}: QuestionCardProps) {
  const [answer, setAnswer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    isCorrect: boolean;
    correctAnswers: string[];
  } | null>(null);

  const handleSubmit = async () => {
    if (!answer.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const result = await onSubmit(answer);
      setFeedback({
        isCorrect: result.isCorrect,
        correctAnswers: result.correctAnswers,
      });
    } catch (error) {
      console.error("Error submitting answer:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    setAnswer("");
    setFeedback(null);
    onNext();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (feedback) {
        handleNext();
      } else {
        handleSubmit();
      }
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between">
          <Badge variant="secondary">
            Question {currentIndex + 1} of {totalQuestions}
          </Badge>
          {question.category?.name && (
            <Badge variant="outline" className="text-muted-foreground">
              {question.category.name}
            </Badge>
          )}
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{
              width: `${((currentIndex + (feedback ? 1 : 0)) / totalQuestions) * 100}%`,
            }}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="text-center py-6">
          <span className="text-lg font-medium text-muted-foreground">
            #{question.questionNumber}
          </span>
          <h2 className="text-2xl font-semibold mt-2">{question.questionText}</h2>
        </div>

        {!feedback ? (
          <div className="space-y-4">
            <Input
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your answer..."
              className="text-lg py-6"
              autoFocus
              disabled={isSubmitting}
            />
            <p className="text-sm text-muted-foreground text-center">
              Type your answer and press Enter or click Submit
            </p>
          </div>
        ) : (
          <div
            className={`rounded-lg p-6 ${
              feedback.isCorrect
                ? "bg-green-500/10 border border-green-500/20"
                : "bg-red-500/10 border border-red-500/20"
            }`}
          >
            <div className="flex items-center gap-3 mb-4">
              {feedback.isCorrect ? (
                <>
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                  <span className="text-lg font-medium text-green-500">
                    Correct!
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="h-6 w-6 text-red-500" />
                  <span className="text-lg font-medium text-red-500">
                    Incorrect
                  </span>
                </>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Your answer:</p>
              <p className="font-medium">{answer}</p>
            </div>

            {!feedback.isCorrect && (
              <div className="mt-4 space-y-2">
                <p className="text-sm text-muted-foreground">Correct answer(s):</p>
                <ul className="list-disc list-inside space-y-1">
                  {feedback.correctAnswers.map((ans, i) => (
                    <li key={i} className="font-medium text-green-600 dark:text-green-400">
                      {ans}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-end">
        {!feedback ? (
          <Button
            onClick={handleSubmit}
            disabled={!answer.trim() || isSubmitting}
            size="lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Checking...
              </>
            ) : (
              "Submit Answer"
            )}
          </Button>
        ) : (
          <Button onClick={handleNext} size="lg">
            {isLast ? "See Results" : "Next Question"}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
