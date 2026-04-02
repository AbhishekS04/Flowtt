import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, expenses, incomes } from "@/lib/schema";
import { eq } from "drizzle-orm";

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

export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getOrCreateUser(userId);

  const allExpenses = await db
    .select({ amount: expenses.amount, paymentMethod: expenses.paymentMethod })
    .from(expenses)
    .where(eq(expenses.userId, user.id));

  const allIncomes = await db
    .select({ amount: incomes.amount, paymentMethod: incomes.paymentMethod })
    .from(incomes)
    .where(eq(incomes.userId, user.id));

  let cashExpenses = 0;
  let onlineExpenses = 0;
  for (const e of allExpenses) {
    if (e.paymentMethod === "cash") cashExpenses += parseFloat(e.amount);
    else onlineExpenses += parseFloat(e.amount);
  }

  let cashIncomes = 0;
  let onlineIncomes = 0;
  for (const i of allIncomes) {
    if (i.paymentMethod === "cash") cashIncomes += parseFloat(i.amount);
    else onlineIncomes += parseFloat(i.amount);
  }

  // To make balance = 0:
  // balance = initialBalance + incomes - expenses = 0
  // => initialBalance = expenses - incomes
  const newCashInitial = cashExpenses - cashIncomes;
  const newOnlineInitial = onlineExpenses - onlineIncomes;

  const updated = await db
    .update(users)
    .set({
      initialCashBalance: String(newCashInitial),
      initialOnlineBalance: String(newOnlineInitial),
    })
    .where(eq(users.id, user.id))
    .returning();

  return NextResponse.json({ success: true, user: updated[0] });
}
