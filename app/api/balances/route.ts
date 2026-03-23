import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, expenses, incomes } from "@/lib/schema";
import { eq } from "drizzle-orm";

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

  const allExpenses = await db.select({ amount: expenses.amount, paymentMethod: expenses.paymentMethod }).from(expenses).where(eq(expenses.userId, user.id));
  const allIncomes = await db.select({ amount: incomes.amount, paymentMethod: incomes.paymentMethod }).from(incomes).where(eq(incomes.userId, user.id));

  let cashExpenses = 0;
  let onlineExpenses = 0;
  for (const e of allExpenses) {
    if (e.paymentMethod === 'cash') cashExpenses += parseFloat(e.amount);
    else onlineExpenses += parseFloat(e.amount);
  }

  let cashIncomes = 0;
  let onlineIncomes = 0;
  for (const i of allIncomes) {
    if (i.paymentMethod === 'cash') cashIncomes += parseFloat(i.amount);
    else onlineIncomes += parseFloat(i.amount);
  }

  const cash = parseFloat(user.initialCashBalance || "0") + cashIncomes - cashExpenses;
  const online = parseFloat(user.initialOnlineBalance || "0") + onlineIncomes - onlineExpenses;

  return NextResponse.json({ cash, online });
}

export async function PATCH(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getOrCreateUser(userId);
  const body = await request.json();
  const { initialCashBalance, initialOnlineBalance } = body;

  const updated = await db
    .update(users)
    .set({
      ...(initialCashBalance !== undefined && { initialCashBalance: String(initialCashBalance) }),
      ...(initialOnlineBalance !== undefined && { initialOnlineBalance: String(initialOnlineBalance) }),
    })
    .where(eq(users.id, user.id))
    .returning();

  return NextResponse.json(updated[0]);
}
