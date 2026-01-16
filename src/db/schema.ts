import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, boolean, index, integer, jsonb, real } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const interviewSession = pgTable(
  "interview_session",
  {
    id: text("id").primaryKey(),
    callId: text("call_id").notNull().unique(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name"),
    interviewType: text("interview_type").notNull(),
    language: text("language").notNull(),
    voice: text("voice").notNull(),
    status: text("status").notNull().default("in_progress"),
    summaryStatus: text("summary_status").default("pending"),
    fullTranscript: text("full_transcript"),
    startedAt: timestamp("started_at").notNull(),
    endedAt: timestamp("ended_at"),
    durationMs: integer("duration_ms"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("interview_session_userId_idx").on(table.userId)],
);

export const sessionTranscript = pgTable(
  "session_transcript",
  {
    id: text("id").primaryKey(),
    sessionId: text("session_id")
      .notNull()
      .references(() => interviewSession.id, { onDelete: "cascade" }),
    speaker: text("speaker").notNull(),
    text: text("text").notNull(),
    sequenceNumber: integer("sequence_number").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("session_transcript_sessionId_idx").on(table.sessionId),
    index("session_transcript_sequence_idx").on(table.sessionId, table.sequenceNumber),
  ],
);

export const sessionSummary = pgTable(
  "session_summary",
  {
    id: text("id").primaryKey(),
    sessionId: text("session_id")
      .notNull()
      .unique()
      .references(() => interviewSession.id, { onDelete: "cascade" }),
    overallSummary: text("overall_summary").notNull(),
    strengths: text("strengths").notNull(),
    areasForImprovement: text("areas_for_improvement").notNull(),
    actionableNextSteps: text("actionable_next_steps").notNull(),
    overallScore: integer("overall_score"),
    modelUsed: text("model_used").default("gemini-1.5-flash"),
    generatedAt: timestamp("generated_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("session_summary_sessionId_idx").on(table.sessionId)],
);

// ===========================================
// CITIZENSHIP QUIZ TABLES
// ===========================================

export const quizCategory = pgTable("quiz_category", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  parentId: text("parent_id"),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const quizQuestion = pgTable(
  "quiz_question",
  {
    id: text("id").primaryKey(),
    categoryId: text("category_id")
      .notNull()
      .references(() => quizCategory.id, { onDelete: "cascade" }),
    questionNumber: integer("question_number").notNull(),
    questionText: text("question_text").notNull(),
    answers: jsonb("answers").notNull().$type<string[]>(),
    testVersion: text("test_version").notNull().default("2008"),
    difficulty: text("difficulty").default("medium"),
    explanation: text("explanation"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("quiz_question_categoryId_idx").on(table.categoryId),
    index("quiz_question_testVersion_idx").on(table.testVersion),
  ]
);

export const quizAttempt = pgTable(
  "quiz_attempt",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    testVersion: text("test_version").notNull(),
    quizType: text("quiz_type").notNull().default("full"),
    categoryId: text("category_id"),
    totalQuestions: integer("total_questions").notNull(),
    correctAnswers: integer("correct_answers").notNull().default(0),
    wrongAnswers: integer("wrong_answers").notNull().default(0),
    score: real("score"),
    status: text("status").notNull().default("in_progress"),
    startedAt: timestamp("started_at").defaultNow().notNull(),
    completedAt: timestamp("completed_at"),
    durationMs: integer("duration_ms"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("quiz_attempt_userId_idx").on(table.userId),
    index("quiz_attempt_status_idx").on(table.status),
  ]
);

export const quizResponse = pgTable(
  "quiz_response",
  {
    id: text("id").primaryKey(),
    attemptId: text("attempt_id")
      .notNull()
      .references(() => quizAttempt.id, { onDelete: "cascade" }),
    questionId: text("question_id")
      .notNull()
      .references(() => quizQuestion.id, { onDelete: "cascade" }),
    userAnswer: text("user_answer").notNull(),
    isCorrect: boolean("is_correct").notNull(),
    answeredAt: timestamp("answered_at").defaultNow().notNull(),
    timeSpentMs: integer("time_spent_ms"),
  },
  (table) => [
    index("quiz_response_attemptId_idx").on(table.attemptId),
    index("quiz_response_questionId_idx").on(table.questionId),
  ]
);

export const userStudyProgress = pgTable(
  "user_study_progress",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    categoryId: text("category_id")
      .notNull()
      .references(() => quizCategory.id, { onDelete: "cascade" }),
    testVersion: text("test_version").notNull(),
    totalAttempts: integer("total_attempts").notNull().default(0),
    correctAttempts: integer("correct_attempts").notNull().default(0),
    masteryScore: real("mastery_score").default(0),
    lastPracticedAt: timestamp("last_practiced_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("user_study_progress_userId_idx").on(table.userId),
    index("user_study_progress_categoryId_idx").on(table.categoryId),
  ]
);

export const userQuestionStats = pgTable(
  "user_question_stats",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    questionId: text("question_id")
      .notNull()
      .references(() => quizQuestion.id, { onDelete: "cascade" }),
    timesAttempted: integer("times_attempted").notNull().default(0),
    timesCorrect: integer("times_correct").notNull().default(0),
    lastAttemptedAt: timestamp("last_attempted_at"),
    lastCorrectAt: timestamp("last_correct_at"),
    streak: integer("streak").default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("user_question_stats_userId_idx").on(table.userId),
    index("user_question_stats_questionId_idx").on(table.questionId),
  ]
);

// ===========================================
// RELATIONS
// ===========================================

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  interviewSessions: many(interviewSession),
  quizAttempts: many(quizAttempt),
  studyProgress: many(userStudyProgress),
  questionStats: many(userQuestionStats),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const interviewSessionRelations = relations(interviewSession, ({ one, many }) => ({
  user: one(user, {
    fields: [interviewSession.userId],
    references: [user.id],
  }),
  transcripts: many(sessionTranscript),
  summary: one(sessionSummary),
}));

export const sessionTranscriptRelations = relations(sessionTranscript, ({ one }) => ({
  session: one(interviewSession, {
    fields: [sessionTranscript.sessionId],
    references: [interviewSession.id],
  }),
}));

export const sessionSummaryRelations = relations(sessionSummary, ({ one }) => ({
  session: one(interviewSession, {
    fields: [sessionSummary.sessionId],
    references: [interviewSession.id],
  }),
}));

// Quiz Relations
export const quizCategoryRelations = relations(quizCategory, ({ one, many }) => ({
  parent: one(quizCategory, {
    fields: [quizCategory.parentId],
    references: [quizCategory.id],
    relationName: "categoryParent",
  }),
  children: many(quizCategory, { relationName: "categoryParent" }),
  questions: many(quizQuestion),
  studyProgress: many(userStudyProgress),
}));

export const quizQuestionRelations = relations(quizQuestion, ({ one, many }) => ({
  category: one(quizCategory, {
    fields: [quizQuestion.categoryId],
    references: [quizCategory.id],
  }),
  responses: many(quizResponse),
  userStats: many(userQuestionStats),
}));

export const quizAttemptRelations = relations(quizAttempt, ({ one, many }) => ({
  user: one(user, {
    fields: [quizAttempt.userId],
    references: [user.id],
  }),
  category: one(quizCategory, {
    fields: [quizAttempt.categoryId],
    references: [quizCategory.id],
  }),
  responses: many(quizResponse),
}));

export const quizResponseRelations = relations(quizResponse, ({ one }) => ({
  attempt: one(quizAttempt, {
    fields: [quizResponse.attemptId],
    references: [quizAttempt.id],
  }),
  question: one(quizQuestion, {
    fields: [quizResponse.questionId],
    references: [quizQuestion.id],
  }),
}));

export const userStudyProgressRelations = relations(userStudyProgress, ({ one }) => ({
  user: one(user, {
    fields: [userStudyProgress.userId],
    references: [user.id],
  }),
  category: one(quizCategory, {
    fields: [userStudyProgress.categoryId],
    references: [quizCategory.id],
  }),
}));

export const userQuestionStatsRelations = relations(userQuestionStats, ({ one }) => ({
  user: one(user, {
    fields: [userQuestionStats.userId],
    references: [user.id],
  }),
  question: one(quizQuestion, {
    fields: [userQuestionStats.questionId],
    references: [quizQuestion.id],
  }),
}));
