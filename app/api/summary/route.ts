import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, expenses } from "@/lib/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { getMonthString } from "@/lib/utils";

async function getOrCreateUser(clerkUserId: string) {
  const existing = await db.select().from(users).where(eq(users.clerkUserId, clerkUserId)).limit(1);
  if (existing.length > 0) return existing[0];
  const created = await db.insert(users).values({ clerkUserId }).returning();
  return created[0];
}

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getOrCreateUser(userId);
  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month") ?? getMonthString();

  const [year, mon] = month.split("-");
  const startDate = `${year}-${mon}-01`;
  const endDate = `${year}-${mon}-${new Date(Number(year), Number(mon), 0).getDate()}`;

  const monthExpenses = await db
    .select()
    .from(expenses)
    .where(and(eq(expenses.userId, user.id), gte(expenses.date, startDate), lte(expenses.date, endDate)));

  const totalSpent = monthExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);

  const categoryBreakdown: Record<string, number> = {};
  const dailyTotals: Record<string, number> = {};

  for (const e of monthExpenses) {
    categoryBreakdown[e.category] = (categoryBreakdown[e.category] ?? 0) + parseFloat(e.amount);
    dailyTotals[e.date] = (dailyTotals[e.date] ?? 0) + parseFloat(e.amount);
  }

  return NextResponse.json({
    month,
    totalBudget: parseFloat(user.monthlyBudget ?? "0"),
    totalSpent,
    categoryBreakdown,
    dailyTotals,
  });
}
