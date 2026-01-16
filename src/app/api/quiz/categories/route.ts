import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { quizCategory, quizQuestion } from "@/db/schema";
import { eq, sql, isNull } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const testVersion = searchParams.get("testVersion") || "2008";

    // Get all categories with question counts
    const categories = await db
      .select({
        id: quizCategory.id,
        name: quizCategory.name,
        parentId: quizCategory.parentId,
        slug: quizCategory.slug,
        description: quizCategory.description,
        sortOrder: quizCategory.sortOrder,
        questionCount: sql<number>`(
          SELECT COUNT(*) FROM quiz_question
          WHERE quiz_question.category_id = quiz_category.id
          AND quiz_question.test_version = ${testVersion}
        )`.as('questionCount'),
      })
      .from(quizCategory)
      .orderBy(quizCategory.sortOrder);

    // Build hierarchy
    const categoryMap = new Map<string, typeof categories[0] & { children: typeof categories }>();
    const rootCategories: (typeof categories[0] & { children: typeof categories })[] = [];

    // First pass: create map
    for (const cat of categories) {
      categoryMap.set(cat.id, { ...cat, children: [] });
    }

    // Second pass: build hierarchy
    for (const cat of categories) {
      const catWithChildren = categoryMap.get(cat.id)!;
      if (cat.parentId) {
        const parent = categoryMap.get(cat.parentId);
        if (parent) {
          parent.children.push(catWithChildren);
        }
      } else {
        rootCategories.push(catWithChildren);
      }
    }

    return NextResponse.json({
      categories: rootCategories,
      totalCategories: categories.length,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}
