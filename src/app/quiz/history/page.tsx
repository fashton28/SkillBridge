"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  History,
  Trophy,
  XCircle,
  Clock,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

export default function QuizHistoryPage() {
  const router = useRouter();
  const [testVersion, setTestVersion] = useState("2008");

  // Fetch history data
  const { data, isLoading } = useQuery({
    queryKey: ["quiz-history-full", testVersion],
    queryFn: async () => {
      const res = await fetch(`/api/quiz/history?testVersion=${testVersion}&limit=50`);
      if (!res.ok) throw new Error("Failed to fetch history");
      return res.json();
    },
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (ms: number | null) => {
    if (!ms) return "N/A";
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    if (minutes === 0) return `${seconds}s`;
    return `${minutes}m ${seconds}s`;
  };

  const attempts = data?.attempts || [];

  // Calculate stats
  const completedAttempts = attempts.filter((a: { status: string }) => a.status === "completed");
  const avgScore = completedAttempts.length > 0
    ? completedAttempts.reduce((sum: number, a: { score: number }) => sum + a.score, 0) / completedAttempts.length
    : 0;
  const passedCount = completedAttempts.filter((a: { score: number }) => a.score >= 60).length;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.push("/quiz")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Quiz
          </Button>
          <Select value={testVersion} onValueChange={setTestVersion}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2008">2008 Test</SelectItem>
              <SelectItem value="2025">2025 Test</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex-1 overflow-auto container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Quiz History</h1>
          <p className="text-muted-foreground">
            View all your past quiz attempts
          </p>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{attempts.length}</p>
                  <p className="text-xs text-muted-foreground">Total Attempts</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{passedCount}</p>
                  <p className="text-xs text-muted-foreground">Passed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-2xl font-bold">{completedAttempts.length - passedCount}</p>
                  <p className="text-xs text-muted-foreground">Need Practice</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{Math.round(avgScore)}%</p>
                  <p className="text-xs text-muted-foreground">Avg. Score</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* History List */}
        <Card>
          <CardHeader>
            <CardTitle>All Attempts</CardTitle>
            <CardDescription>
              Click on an attempt to view details
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : attempts.length === 0 ? (
              <div className="text-center py-8">
                <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No quiz attempts yet</p>
                <Button onClick={() => router.push("/quiz")}>
                  Take Your First Quiz
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {attempts.map((attempt: {
                  id: string;
                  score: number;
                  totalQuestions: number;
                  correctAnswers: number;
                  startedAt: string;
                  completedAt: string | null;
                  durationMs: number | null;
                  status: string;
                  quizType: string;
                }) => (
                  <div
                    key={attempt.id}
                    className="flex items-center justify-between p-4 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => {
                      if (attempt.status === "completed") {
                        router.push(`/quiz/results/${attempt.id}`);
                      } else {
                        router.push(`/quiz/take/${attempt.id}`);
                      }
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`h-10 w-10 rounded-full flex items-center justify-center ${
                          attempt.status !== "completed"
                            ? "bg-yellow-100"
                            : attempt.score >= 60
                            ? "bg-green-100"
                            : "bg-red-100"
                        }`}
                      >
                        {attempt.status !== "completed" ? (
                          <Clock className="h-5 w-5 text-yellow-600" />
                        ) : attempt.score >= 60 ? (
                          <Trophy className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {attempt.correctAnswers}/{attempt.totalQuestions} correct
                          </span>
                          {attempt.status === "completed" && (
                            <Badge
                              variant={attempt.score >= 60 ? "default" : "destructive"}
                            >
                              {Math.round(attempt.score)}%
                            </Badge>
                          )}
                          {attempt.status !== "completed" && (
                            <Badge variant="secondary">In Progress</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(attempt.startedAt)}
                          {attempt.durationMs && ` · ${formatDuration(attempt.durationMs)}`}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
