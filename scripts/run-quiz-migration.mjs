import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const sql = neon(process.env.DATABASE_URL);

async function runMigration() {
  console.log('Running quiz tables migration...\n');

  try {
    // Create quiz_category table
    await sql`CREATE TABLE IF NOT EXISTS "quiz_category" (
      "id" text PRIMARY KEY NOT NULL,
      "name" text NOT NULL,
      "parent_id" text,
      "slug" text NOT NULL UNIQUE,
      "description" text,
      "sort_order" integer DEFAULT 0,
      "created_at" timestamp DEFAULT now() NOT NULL,
      "updated_at" timestamp DEFAULT now() NOT NULL
    )`;
    console.log('✓ Created quiz_category table');

    // Create quiz_question table
    await sql`CREATE TABLE IF NOT EXISTS "quiz_question" (
      "id" text PRIMARY KEY NOT NULL,
      "category_id" text NOT NULL REFERENCES "quiz_category"("id") ON DELETE CASCADE,
      "question_number" integer NOT NULL,
      "question_text" text NOT NULL,
      "answers" jsonb NOT NULL,
      "test_version" text DEFAULT '2008' NOT NULL,
      "difficulty" text DEFAULT 'medium',
      "explanation" text,
      "created_at" timestamp DEFAULT now() NOT NULL,
      "updated_at" timestamp DEFAULT now() NOT NULL
    )`;
    console.log('✓ Created quiz_question table');

    // Create quiz_attempt table
    await sql`CREATE TABLE IF NOT EXISTS "quiz_attempt" (
      "id" text PRIMARY KEY NOT NULL,
      "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
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
    )`;
    console.log('✓ Created quiz_attempt table');

    // Create quiz_response table
    await sql`CREATE TABLE IF NOT EXISTS "quiz_response" (
      "id" text PRIMARY KEY NOT NULL,
      "attempt_id" text NOT NULL REFERENCES "quiz_attempt"("id") ON DELETE CASCADE,
      "question_id" text NOT NULL REFERENCES "quiz_question"("id") ON DELETE CASCADE,
      "user_answer" text NOT NULL,
      "is_correct" boolean NOT NULL,
      "answered_at" timestamp DEFAULT now() NOT NULL,
      "time_spent_ms" integer
    )`;
    console.log('✓ Created quiz_response table');

    // Create user_study_progress table
    await sql`CREATE TABLE IF NOT EXISTS "user_study_progress" (
      "id" text PRIMARY KEY NOT NULL,
      "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
      "category_id" text NOT NULL REFERENCES "quiz_category"("id") ON DELETE CASCADE,
      "test_version" text NOT NULL,
      "total_attempts" integer DEFAULT 0 NOT NULL,
      "correct_attempts" integer DEFAULT 0 NOT NULL,
      "mastery_score" real DEFAULT 0,
      "last_practiced_at" timestamp,
      "created_at" timestamp DEFAULT now() NOT NULL,
      "updated_at" timestamp DEFAULT now() NOT NULL
    )`;
    console.log('✓ Created user_study_progress table');

    // Create user_question_stats table
    await sql`CREATE TABLE IF NOT EXISTS "user_question_stats" (
      "id" text PRIMARY KEY NOT NULL,
      "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
      "question_id" text NOT NULL REFERENCES "quiz_question"("id") ON DELETE CASCADE,
      "times_attempted" integer DEFAULT 0 NOT NULL,
      "times_correct" integer DEFAULT 0 NOT NULL,
      "last_attempted_at" timestamp,
      "last_correct_at" timestamp,
      "streak" integer DEFAULT 0,
      "created_at" timestamp DEFAULT now() NOT NULL,
      "updated_at" timestamp DEFAULT now() NOT NULL
    )`;
    console.log('✓ Created user_question_stats table');

    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS "quiz_question_categoryId_idx" ON "quiz_question" ("category_id")`;
    await sql`CREATE INDEX IF NOT EXISTS "quiz_question_testVersion_idx" ON "quiz_question" ("test_version")`;
    await sql`CREATE INDEX IF NOT EXISTS "quiz_attempt_userId_idx" ON "quiz_attempt" ("user_id")`;
    await sql`CREATE INDEX IF NOT EXISTS "quiz_attempt_status_idx" ON "quiz_attempt" ("status")`;
    await sql`CREATE INDEX IF NOT EXISTS "quiz_response_attemptId_idx" ON "quiz_response" ("attempt_id")`;
    await sql`CREATE INDEX IF NOT EXISTS "quiz_response_questionId_idx" ON "quiz_response" ("question_id")`;
    await sql`CREATE INDEX IF NOT EXISTS "user_study_progress_userId_idx" ON "user_study_progress" ("user_id")`;
    await sql`CREATE INDEX IF NOT EXISTS "user_study_progress_categoryId_idx" ON "user_study_progress" ("category_id")`;
    await sql`CREATE INDEX IF NOT EXISTS "user_question_stats_userId_idx" ON "user_question_stats" ("user_id")`;
    await sql`CREATE INDEX IF NOT EXISTS "user_question_stats_questionId_idx" ON "user_question_stats" ("question_id")`;
    console.log('✓ Created indexes');

    console.log('\n✅ Migration complete!');
  } catch (err) {
    console.error('Migration error:', err.message);
    process.exit(1);
  }
}

runMigration();
