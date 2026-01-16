"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface CategoryProgressProps {
  categories: {
    categoryId: string;
    categoryName: string;
    masteryScore: number;
    totalAttempts: number;
    correctAttempts: number;
    lastPracticedAt: Date | null;
  }[];
}

export function CategoryProgress({ categories }: CategoryProgressProps) {
  const getMasteryColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  const getMasteryBadge = (score: number) => {
    if (score >= 80) return { label: "Mastered", variant: "default" as const };
    if (score >= 60) return { label: "Proficient", variant: "secondary" as const };
    if (score >= 40) return { label: "Learning", variant: "outline" as const };
    return { label: "Needs Work", variant: "destructive" as const };
  };

  const formatLastPracticed = (date: Date | null) => {
    if (!date) return "Never practiced";
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
  };

  if (categories.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">
            No progress yet. Start a quiz to track your progress!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {categories.map((category) => {
        const badge = getMasteryBadge(category.masteryScore);
        return (
          <Card key={category.categoryId}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium">
                  {category.categoryName}
                </CardTitle>
                <Badge variant={badge.variant}>{badge.label}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Mastery</span>
                  <span className={`font-medium ${getMasteryColor(category.masteryScore)}`}>
                    {Math.round(category.masteryScore)}%
                  </span>
                </div>
                <Progress value={category.masteryScore} className="h-2" />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {category.correctAttempts}/{category.totalAttempts} correct
                  </span>
                  <span>{formatLastPracticed(category.lastPracticedAt)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
