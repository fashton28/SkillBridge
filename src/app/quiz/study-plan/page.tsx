"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Target,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Play,
  BookOpen,
} from "lucide-react";

export default function StudyPlanPage() {
  const router = useRouter();

  // Fetch study plan data
  const { data, isLoading } = useQuery({
    queryKey: ["study-plan"],
    queryFn: async () => {
      const res = await fetch("/api/quiz/study-plan");
      if (!res.ok) throw new Error("Failed to fetch study plan");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Skeleton className="h-8 w-48 mb-8" />
          <div className="space-y-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-48" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    );
  }

  const studyPlan = data?.studyPlan || {
    overallMastery: 0,
    totalQuestionsAttempted: 0,
    totalQuestions: 100,
    weakCategories: [],
    recommendedQuestions: [],
    nextMilestone: { target: 60, label: "Pass Practice Threshold" },
    estimatedSessionsToMastery: 0,
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Your Study Plan</h1>
          <p className="text-muted-foreground">
            Personalized recommendations based on your performance
          </p>
        </div>

        {/* Overall Progress Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Overall Progress
            </CardTitle>
            <CardDescription>
              Track your journey to mastering the USCIS civics test
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Overall Mastery</span>
                  <span className="font-medium">{Math.round(studyPlan.overallMastery)}%</span>
                </div>
                <Progress value={studyPlan.overallMastery} className="h-3" />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-2xl font-bold">{studyPlan.totalQuestionsAttempted}</p>
                  <p className="text-xs text-muted-foreground">Questions Practiced</p>
                </div>
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-2xl font-bold">{studyPlan.totalQuestions}</p>
                  <p className="text-xs text-muted-foreground">Total Questions</p>
                </div>
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-2xl font-bold">{studyPlan.weakCategories?.length || 0}</p>
                  <p className="text-xs text-muted-foreground">Areas to Improve</p>
                </div>
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-2xl font-bold">{studyPlan.estimatedSessionsToMastery || "?"}</p>
                  <p className="text-xs text-muted-foreground">Sessions to Goal</p>
                </div>
              </div>

              {/* Next Milestone */}
              {studyPlan.nextMilestone && studyPlan.overallMastery < 100 && (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Next Milestone</p>
                    <p className="text-sm text-muted-foreground">
                      Reach {studyPlan.nextMilestone.target}% - {studyPlan.nextMilestone.label}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Weak Categories */}
        {studyPlan.weakCategories && studyPlan.weakCategories.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-500" />
                Focus Areas
              </CardTitle>
              <CardDescription>
                Categories that need more practice (below 70% mastery)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {studyPlan.weakCategories.map((category: {
                  categoryId: string;
                  categoryName: string;
                  masteryScore: number;
                  totalAttempts: number;
                  correctAttempts: number;
                }) => (
                  <div
                    key={category.categoryId}
                    className="flex items-center justify-between p-4 rounded-lg border"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">{category.categoryName}</span>
                        <Badge
                          variant={
                            category.masteryScore >= 60
                              ? "secondary"
                              : category.masteryScore >= 40
                              ? "outline"
                              : "destructive"
                          }
                        >
                          {Math.round(category.masteryScore)}%
                        </Badge>
                      </div>
                      <Progress value={category.masteryScore} className="h-2 w-48" />
                      <p className="text-xs text-muted-foreground mt-1">
                        {category.correctAttempts}/{category.totalAttempts} correct
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/quiz?category=${category.categoryId}`)}
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Practice
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recommended Questions */}
        {studyPlan.recommendedQuestions && studyPlan.recommendedQuestions.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Recommended Questions
              </CardTitle>
              <CardDescription>
                Questions you should focus on next
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {studyPlan.recommendedQuestions.slice(0, 10).map((question: {
                  id: string;
                  questionNumber: number;
                  questionText: string;
                  categoryName: string;
                  reason: string;
                }) => (
                  <div
                    key={question.id}
                    className="p-4 rounded-lg border hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-muted-foreground">
                            #{question.questionNumber}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {question.categoryName}
                          </Badge>
                        </div>
                        <p className="font-medium">{question.questionText}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {question.reason}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {(!studyPlan.weakCategories || studyPlan.weakCategories.length === 0) &&
         (!studyPlan.recommendedQuestions || studyPlan.recommendedQuestions.length === 0) && (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Great Progress!</h3>
              <p className="text-muted-foreground mb-4">
                {studyPlan.totalQuestionsAttempted === 0
                  ? "Start taking quizzes to get personalized recommendations."
                  : "You're doing well! Keep practicing to maintain your mastery."}
              </p>
              <Button onClick={() => router.push("/quiz")}>
                <Play className="h-4 w-4 mr-2" />
                Take a Quiz
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <Button
            variant="outline"
            size="lg"
            onClick={() => router.push("/quiz")}
          >
            Back to Dashboard
          </Button>
          <Button size="lg" onClick={() => router.push("/quiz")}>
            <Play className="h-4 w-4 mr-2" />
            Start Practice Session
          </Button>
        </div>
      </div>
    </div>
  );
}
