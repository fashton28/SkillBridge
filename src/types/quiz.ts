export interface QuizCategory {
  id: string;
  name: string;
  parentId: string | null;
  slug: string;
  description: string | null;
  sortOrder: number | null;
  children?: QuizCategory[];
  questionCount?: number;
}

export interface QuizQuestion {
  id: string;
  categoryId: string;
  questionNumber: number;
  questionText: string;
  answers: string[];
  testVersion: string;
  difficulty: string | null;
  explanation: string | null;
  category?: QuizCategory;
}

export interface QuizAttempt {
  id: string;
  userId: string;
  testVersion: string;
  quizType: string;
  categoryId: string | null;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  score: number | null;
  status: string;
  startedAt: Date;
  completedAt: Date | null;
  durationMs: number | null;
}

export interface QuizResponse {
  id: string;
  attemptId: string;
  questionId: string;
  userAnswer: string;
  isCorrect: boolean;
  answeredAt: Date;
  timeSpentMs: number | null;
  question?: QuizQuestion;
}

export interface UserStudyProgress {
  id: string;
  userId: string;
  categoryId: string;
  testVersion: string;
  totalAttempts: number;
  correctAttempts: number;
  masteryScore: number | null;
  lastPracticedAt: Date | null;
  category?: QuizCategory;
}

export interface UserQuestionStats {
  id: string;
  userId: string;
  questionId: string;
  timesAttempted: number;
  timesCorrect: number;
  lastAttemptedAt: Date | null;
  lastCorrectAt: Date | null;
  streak: number | null;
}

export interface CategoryPerformance {
  categoryId: string;
  categoryName: string;
  totalQuestions: number;
  attemptedQuestions: number;
  correctAnswers: number;
  masteryScore: number;
  lastPracticedAt: Date | null;
}

export interface StudyPlan {
  weakCategories: CategoryPerformance[];
  recommendedQuestions: QuizQuestion[];
  dailyGoal: number;
  estimatedTimeToMastery: string;
  nextMilestone: string;
  overallProgress: number;
}
