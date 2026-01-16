CREATE TABLE "quiz_attempt" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"test_version" text NOT NULL,
	"quiz_type" text DEFAULT 'full' NOT NULL,
	"category_id" text,
	"total_questions" integer NOT NULL,
	"correct_answers" integer DEFAULT 0 NOT NULL,
	"wrong_answers" integer DEFAULT 0 NOT NULL,
	"score" real,
	"status" text DEFAULT 'in_progress' NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"duration_ms" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quiz_category" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"parent_id" text,
	"slug" text NOT NULL,
	"description" text,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "quiz_category_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "quiz_question" (
	"id" text PRIMARY KEY NOT NULL,
	"category_id" text NOT NULL,
	"question_number" integer NOT NULL,
	"question_text" text NOT NULL,
	"answers" jsonb NOT NULL,
	"test_version" text DEFAULT '2008' NOT NULL,
	"difficulty" text DEFAULT 'medium',
	"explanation" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quiz_response" (
	"id" text PRIMARY KEY NOT NULL,
	"attempt_id" text NOT NULL,
	"question_id" text NOT NULL,
	"user_answer" text NOT NULL,
	"is_correct" boolean NOT NULL,
	"answered_at" timestamp DEFAULT now() NOT NULL,
	"time_spent_ms" integer
);
--> statement-breakpoint
CREATE TABLE "user_question_stats" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"question_id" text NOT NULL,
	"times_attempted" integer DEFAULT 0 NOT NULL,
	"times_correct" integer DEFAULT 0 NOT NULL,
	"last_attempted_at" timestamp,
	"last_correct_at" timestamp,
	"streak" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_study_progress" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"category_id" text NOT NULL,
	"test_version" text NOT NULL,
	"total_attempts" integer DEFAULT 0 NOT NULL,
	"correct_attempts" integer DEFAULT 0 NOT NULL,
	"mastery_score" real DEFAULT 0,
	"last_practiced_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "interview_session" ADD COLUMN "name" text;--> statement-breakpoint
ALTER TABLE "quiz_attempt" ADD CONSTRAINT "quiz_attempt_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_question" ADD CONSTRAINT "quiz_question_category_id_quiz_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."quiz_category"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_response" ADD CONSTRAINT "quiz_response_attempt_id_quiz_attempt_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."quiz_attempt"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_response" ADD CONSTRAINT "quiz_response_question_id_quiz_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."quiz_question"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_question_stats" ADD CONSTRAINT "user_question_stats_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_question_stats" ADD CONSTRAINT "user_question_stats_question_id_quiz_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."quiz_question"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_study_progress" ADD CONSTRAINT "user_study_progress_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_study_progress" ADD CONSTRAINT "user_study_progress_category_id_quiz_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."quiz_category"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "quiz_attempt_userId_idx" ON "quiz_attempt" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "quiz_attempt_status_idx" ON "quiz_attempt" USING btree ("status");--> statement-breakpoint
CREATE INDEX "quiz_question_categoryId_idx" ON "quiz_question" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "quiz_question_testVersion_idx" ON "quiz_question" USING btree ("test_version");--> statement-breakpoint
CREATE INDEX "quiz_response_attemptId_idx" ON "quiz_response" USING btree ("attempt_id");--> statement-breakpoint
CREATE INDEX "quiz_response_questionId_idx" ON "quiz_response" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "user_question_stats_userId_idx" ON "user_question_stats" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_question_stats_questionId_idx" ON "user_question_stats" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "user_study_progress_userId_idx" ON "user_study_progress" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_study_progress_categoryId_idx" ON "user_study_progress" USING btree ("category_id");