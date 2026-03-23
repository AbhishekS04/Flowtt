import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, categoryBudgets } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { getMonthString } from "@/lib/utils";

async function getUser(clerkUserId: string) {
  const result = await db.select().from(users).where(eq(users.clerkUserId, clerkUserId)).limit(1);
  return result[0] ?? null;
}

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getUser(userId);
  if (!user) return NextResponse.json([]);

  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month") ?? getMonthString();

  const budgets = await db
    .select()
    .from(categoryBudgets)
    .where(and(eq(categoryBudgets.userId, user.id), eq(categoryBudgets.month, month)));

  return NextResponse.json(budgets);
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getUser(userId);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { category, limitAmount, month } = await request.json();
  const targetMonth = month ?? getMonthString();

  const existing = await db
    .select()
    .from(categoryBudgets)
    .where(
      and(
        eq(categoryBudgets.userId, user.id),
        eq(categoryBudgets.category, category),
        eq(categoryBudgets.month, targetMonth)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    const updated = await db
      .update(categoryBudgets)
      .set({ limitAmount: String(limitAmount) })
      .where(eq(categoryBudgets.id, existing[0].id))
      .returning();
    return NextResponse.json(updated[0]);
  } else {
    const created = await db
      .insert(categoryBudgets)
      .values({
        userId: user.id,
        category,
        limitAmount: String(limitAmount),
        month: targetMonth,
      })
      .returning();
    return NextResponse.json(created[0], { status: 201 });
  }
}
