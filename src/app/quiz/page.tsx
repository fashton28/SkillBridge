"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen,
  Target,
  Trophy,
  Clock,
  ArrowRight,
  Play,
  History,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { CategoryProgress } from "@/components/quiz/CategoryProgress";

export default function QuizPage() {
  const router = useRouter();
  const [testVersion, setTestVersion] = useState("2008");
  const [quizType, setQuizType] = useState("full");
  const [questionCount, setQuestionCount] = useState("10");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [isStartDialogOpen, setIsStartDialogOpen] = useState(false);

  // Fetch progress data
  const { data: progressData, isLoading: isProgressLoading } = useQuery({
    queryKey: ["quiz-progress", testVersion],
    queryFn: async () => {
      const res = await fetch(`/api/quiz/progress?testVersion=${testVersion}`);
      return res.json();
    },
  });

  // Fetch categories
  const { data: categoriesData, isLoading: isCategoriesLoading } = useQuery({
    queryKey: ["quiz-categories", testVersion],
    queryFn: async () => {
      const res = await fetch(`/api/quiz/categories?testVersion=${testVersion}`);
      return res.json();
    },
  });

  // Fetch recent attempts
  const { data: historyData, isLoading: isHistoryLoading } = useQuery({
    queryKey: ["quiz-history", testVersion],
    queryFn: async () => {
      const res = await fetch(`/api/quiz/history?testVersion=${testVersion}&limit=5`);
      return res.json();
    },
  });

  // Start quiz mutation
  const startQuiz = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/quiz/attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testVersion,
          quizType,
          categoryId: quizType === "category" ? selectedCategory : undefined,
          questionCount: parseInt(questionCount),
        }),
      });
      if (!res.ok) throw new Error("Failed to start quiz");
      return res.json();
    },
    onSuccess: (data) => {
      router.push(`/quiz/take/${data.attemptId}`);
    },
  });

  const stats = progressData?.stats || {
    totalAttempts: 0,
    totalCorrect: 0,
    totalQuestions: 100,
    completedQuizzes: 0,
    overallMastery: 0,
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Citizenship Quiz</h1>
            <p className="text-muted-foreground mt-1">
              Practice USCIS civics test questions
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={testVersion} onValueChange={setTestVersion}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2008">2008 Test</SelectItem>
                <SelectItem value="2025">2025 Test</SelectItem>
              </SelectContent>
            </Select>
            <Dialog open={isStartDialogOpen} onOpenChange={setIsStartDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg">
                  <Play className="h-4 w-4 mr-2" />
                  Start Quiz
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Start a New Quiz</DialogTitle>
                  <DialogDescription>
                    Configure your quiz settings
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Quiz Type</label>
                    <Select value={quizType} onValueChange={setQuizType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full">Full Random Quiz</SelectItem>
                        <SelectItem value="category">Category Practice</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {quizType === "category" && categoriesData?.categories && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Category</label>
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categoriesData.categories.map((cat: { id: string; name: string }) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Number of Questions</label>
                    <Select value={questionCount} onValueChange={setQuestionCount}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 Questions (Quick)</SelectItem>
                        <SelectItem value="10">10 Questions (Standard)</SelectItem>
                        <SelectItem value="20">20 Questions (Practice Test)</SelectItem>
                        <SelectItem value="50">50 Questions (Full Practice)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={() => startQuiz.mutate()}
                    disabled={startQuiz.isPending || (quizType === "category" && !selectedCategory)}
                  >
                    {startQuiz.isPending ? "Starting..." : "Start Quiz"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Overall Mastery
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isProgressLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  <span className="text-2xl font-bold">{stats.overallMastery}%</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Questions Practiced
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isProgressLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <span className="text-2xl font-bold">
                    {stats.totalAttempts}/{stats.totalQuestions}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Correct Answers
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isProgressLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  <span className="text-2xl font-bold">{stats.totalCorrect}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Quizzes Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isProgressLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <span className="text-2xl font-bold">{stats.completedQuizzes}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Category Progress */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Category Progress</h2>
              <Button variant="ghost" size="sm" onClick={() => router.push("/quiz/study-plan")}>
                View Study Plan
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>

            {isProgressLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-32" />
                ))}
              </div>
            ) : (
              <CategoryProgress
                categories={
                  progressData?.progress?.map((p: {
                    categoryId: string;
                    categoryName: string;
                    masteryScore: number;
                    totalAttempts: number;
                    correctAttempts: number;
                    lastPracticedAt: string | null;
                  }) => ({
                    ...p,
                    masteryScore: p.masteryScore || 0,
                    lastPracticedAt: p.lastPracticedAt ? new Date(p.lastPracticedAt) : null,
                  })) || []
                }
              />
            )}
          </div>

          {/* Right Column - Recent Activity & Quick Actions */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    setQuizType("full");
                    setQuestionCount("10");
                    setIsStartDialogOpen(true);
                  }}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Take Practice Test (10 Questions)
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push("/quiz/study-plan")}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Practice Weak Areas
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push("/quiz/history")}
                >
                  <History className="h-4 w-4 mr-2" />
                  View Quiz History
                </Button>
              </CardContent>
            </Card>

            {/* Recent Attempts */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Attempts</CardTitle>
              </CardHeader>
              <CardContent>
                {isHistoryLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-12" />
                    ))}
                  </div>
                ) : historyData?.attempts?.length > 0 ? (
                  <div className="space-y-3">
                    {historyData.attempts.slice(0, 5).map((attempt: {
                      id: string;
                      score: number;
                      totalQuestions: number;
                      correctAnswers: number;
                      startedAt: string;
                      status: string;
                    }) => (
                      <div
                        key={attempt.id}
                        className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => {
                          if (attempt.status === "completed") {
                            router.push(`/quiz/results/${attempt.id}`);
                          } else {
                            router.push(`/quiz/take/${attempt.id}`);
                          }
                        }}
                      >
                        <div>
                          <div className="font-medium">
                            {attempt.correctAnswers}/{attempt.totalQuestions} correct
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(attempt.startedAt).toLocaleDateString()}
                          </div>
                        </div>
                        <Badge
                          variant={
                            attempt.status === "completed"
                              ? attempt.score >= 60
                                ? "default"
                                : "destructive"
                              : "secondary"
                          }
                        >
                          {attempt.status === "completed"
                            ? `${Math.round(attempt.score)}%`
                            : "In Progress"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No quiz attempts yet
                  </p>
                )}
              </CardContent>
            </Card>

            {/* USCIS Test Info */}
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-lg">Test Info</CardTitle>
                <CardDescription>
                  {testVersion === "2008"
                    ? "2008 Civics Test (100 questions)"
                    : "2025 Civics Test (128 questions)"}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>
                  {testVersion === "2008" ? (
                    <>
                      During the naturalization test, you will be asked up to{" "}
                      <strong>10 questions</strong> and must answer at least{" "}
                      <strong>6 correctly</strong> to pass (60%).
                    </>
                  ) : (
                    <>
                      The 2025 test asks <strong>20 questions</strong>. You must
                      answer at least <strong>12 correctly</strong> to pass (60%).
                    </>
                  )}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
