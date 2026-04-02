import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, expenses, incomes } from "@/lib/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { getMonthString } from "@/lib/utils";
import { checkRateLimit, RATE_LIMITS, getClientIdentifier } from "@/lib/rate-limit";

async function getOrCreateUser(clerkUserId: string) {
  const existing = await db.select().from(users).where(eq(users.clerkUserId, clerkUserId)).limit(1);
  if (existing.length > 0) return existing[0];
  try {
    const created = await db.insert(users).values({ clerkUserId }).returning();
    return created[0];
  } catch (error: any) {
    if (error.code === '23505' || (error.message && error.message.includes('unique constraint'))) {
      const retry = await db.select().from(users).where(eq(users.clerkUserId, clerkUserId)).limit(1);
      return retry[0];
    }
    throw error;
  }
}

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const identifier = getClientIdentifier(userId, ip);
  const rateLimit = await checkRateLimit(identifier, RATE_LIMITS.transactions);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { 'X-RateLimit-Remaining': '0' } }
    );
  }

  const user = await getOrCreateUser(userId);
  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month") ?? getMonthString();
  const category = searchParams.get("category");

  const [year, mon] = month.split("-");
  const startDate = `${year}-${mon}-01`;
  const endDate = `${year}-${mon}-${new Date(Number(year), Number(mon), 0).getDate()}`;

  const exps = await db
    .select()
    .from(expenses)
    .where(
      and(
        eq(expenses.userId, user.id),
        gte(expenses.date, startDate),
        lte(expenses.date, endDate),
        category && category !== "Income" ? eq(expenses.category, category) : undefined
      )
    );

  const incs = await db
    .select()
    .from(incomes)
    .where(
      and(
        eq(incomes.userId, user.id),
        gte(incomes.date, startDate),
        lte(incomes.date, endDate)
      )
    );

  let transactions = [
    ...exps.map(e => ({ ...e, type: "expense" as const })),
    ...incs.map(i => ({ 
      id: i.id, 
      amount: i.amount, 
      date: i.date, 
      note: i.note, 
      type: "income" as const, 
      category: i.source, 
      paymentMethod: i.paymentMethod,
      createdAt: i.createdAt 
    }))
  ];

  if (category === "Income") {
    transactions = transactions.filter(t => t.type === "income");
  } else if (category && category !== "") {
    transactions = transactions.filter(t => t.type === "expense" && t.category === category);
  }

  transactions.sort((a, b) => {
    const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
    if (dateDiff !== 0) return dateDiff;
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  });

  return NextResponse.json(transactions);
}
