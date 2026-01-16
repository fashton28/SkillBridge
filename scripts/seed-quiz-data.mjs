import { neon } from '@neondatabase/serverless';
import { nanoid } from 'nanoid';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: '.env' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sql = neon(process.env.DATABASE_URL);

async function seedQuizData() {
  console.log('Seeding USCIS quiz questions...\n');

  // Read questions data
  const questionsPath = path.join(__dirname, '../src/data/uscis-questions.json');
  const questionsData = JSON.parse(fs.readFileSync(questionsPath, 'utf-8'));

  let categoryCount = 0;
  let questionCount = 0;

  for (const [testVersion, testData] of Object.entries(questionsData.tests)) {
    console.log(`Processing ${testVersion} test (${testData.totalQuestions} questions)...`);

    for (const category of testData.categories) {
      // Insert parent category
      const parentCategoryId = nanoid();
      await sql`
        INSERT INTO quiz_category (id, name, slug, sort_order, created_at, updated_at)
        VALUES (${parentCategoryId}, ${category.name}, ${category.id}, ${testData.categories.indexOf(category)}, now(), now())
        ON CONFLICT (slug) DO UPDATE SET name = ${category.name}
      `;
      categoryCount++;
      console.log(`  ✓ Category: ${category.name}`);

      for (const subcategory of category.subcategories) {
        // Insert subcategory
        const subcategoryId = nanoid();
        const subcategorySlug = `${category.id}-${subcategory.id}`;
        await sql`
          INSERT INTO quiz_category (id, name, parent_id, slug, sort_order, created_at, updated_at)
          VALUES (${subcategoryId}, ${subcategory.name}, ${parentCategoryId}, ${subcategorySlug}, ${category.subcategories.indexOf(subcategory)}, now(), now())
          ON CONFLICT (slug) DO UPDATE SET name = ${subcategory.name}, parent_id = ${parentCategoryId}
        `;
        categoryCount++;
        console.log(`    ✓ Subcategory: ${subcategory.name}`);

        // Get the subcategory ID (in case it was updated)
        const [existingSubcat] = await sql`SELECT id FROM quiz_category WHERE slug = ${subcategorySlug}`;
        const finalSubcategoryId = existingSubcat?.id || subcategoryId;

        // Insert questions
        for (const question of subcategory.questions) {
          const questionId = nanoid();
          await sql`
            INSERT INTO quiz_question (id, category_id, question_number, question_text, answers, test_version, created_at, updated_at)
            VALUES (${questionId}, ${finalSubcategoryId}, ${question.number}, ${question.text}, ${JSON.stringify(question.answers)}, ${testVersion}, now(), now())
            ON CONFLICT DO NOTHING
          `;
          questionCount++;
        }
        console.log(`      → Added ${subcategory.questions.length} questions`);
      }
    }
  }

  console.log(`\n✅ Seeding complete!`);
  console.log(`   Categories: ${categoryCount}`);
  console.log(`   Questions: ${questionCount}`);
}

seedQuizData().catch((err) => {
  console.error('Seeding error:', err);
  process.exit(1);
});
