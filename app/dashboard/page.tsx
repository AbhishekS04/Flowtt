import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { users, expenses, categoryBudgets, userCategories, incomes, recurringExpenses, goals, recharges } from "@/lib/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { getMonthString } from "@/lib/utils";
import DashboardClient from "@/components/DashboardClient";
import { syncUserSIPs } from "@/lib/syncSips";

async function getOrCreateUser(clerkUserId: string) {
  const existing = await db.select().from(users).where(eq(users.clerkUserId, clerkUserId)).limit(1);
  let user;
  if (existing.length > 0) {
    user = existing[0];
  } else {
    const created = await db.insert(users).values({ clerkUserId }).returning();
    user = created[0];
  }

  // Seed default categories if none exist
  const cats = await db.select().from(userCategories).where(eq(userCategories.userId, user.id));
  if (cats.length === 0) {
    const defaultCats = [
      { name: "food", icon: "🍔" },
      { name: "transport", icon: "🚗" },
      { name: "entertainment", icon: "🎬" },
      { name: "health", icon: "💊" },
      { name: "shopping", icon: "🛍️" },
      { name: "other", icon: "📦" },
    ];
    await db.insert(userCategories).values(
      defaultCats.map(c => ({ ...c, userId: user.id }))
    );
  }

  return user;
}

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  let user;
  try {
    user = await getOrCreateUser(userId);
    await syncUserSIPs(user.id);
  } catch (error) {
    console.error("Database connection error:", error);
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-4">
        <div className="bg-card border border-border rounded-3xl p-8 max-w-md w-full text-center">
          <h2 className="text-primary font-bold text-xl mb-4 tracking-tighter">
            Database Error
          </h2>
          <p className="text-text-muted text-sm mb-6">Unable to connect. Check your constraints or DATABASE_URL.</p>
          <div className="text-left text-xs text-text-muted font-mono bg-bg border border-border p-4 rounded-xl overflow-x-auto">
            {error instanceof Error ? error.message : String(error)}
          </div>
        </div>
      </div>
    );
  }
  
  const month = getMonthString();
  const [year, mon] = month.split("-");
  const startDate = `${year}-${mon}-01`;
  const endDate = `${year}-${mon}-${new Date(Number(year), Number(mon), 0).getDate()}`;

  const [monthExpenses, catBudgets, customCats, monthIncomes, allExpenses, allIncomes, userSips, userGoals, userRecharges] = await Promise.all([
    db.select().from(expenses).where(
      and(eq(expenses.userId, user.id), gte(expenses.date, startDate), lte(expenses.date, endDate))
    ),
    db.select().from(categoryBudgets).where(
      and(eq(categoryBudgets.userId, user.id), eq(categoryBudgets.month, month))
    ),
    db.select().from(userCategories).where(eq(userCategories.userId, user.id)),
    db.select().from(incomes).where(
      and(eq(incomes.userId, user.id), gte(incomes.date, startDate), lte(incomes.date, endDate))
    ),
    db.select().from(expenses).where(eq(expenses.userId, user.id)),
    db.select().from(incomes).where(eq(incomes.userId, user.id)),
    db.select().from(recurringExpenses).where(eq(recurringExpenses.userId, user.id)),
    db.select().from(goals).where(eq(goals.userId, user.id)),
    db.select().from(recharges).where(eq(recharges.userId, user.id)),
  ]);

  const totalSpent = monthExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
  const totalIncome = monthIncomes.reduce((sum, i) => sum + parseFloat(i.amount), 0);
  const totalSaved = totalIncome - totalSpent;
  const totalBudget = parseFloat(user.monthlyBudget ?? "0");

  const categoryBreakdown: Record<string, number> = {};
  const dailyTotals: Record<string, number> = {};
  for (const e of monthExpenses) {
    categoryBreakdown[e.category] = (categoryBreakdown[e.category] ?? 0) + parseFloat(e.amount);
    dailyTotals[e.date] = (dailyTotals[e.date] ?? 0) + parseFloat(e.amount);
  }

  const categoryLimits: Record<string, number> = {};
  for (const cb of catBudgets) categoryLimits[cb.category] = parseFloat(cb.limitAmount);

  const allTransactions = [
    ...monthExpenses.map(e => ({ ...e, type: 'expense' })),
    ...monthIncomes.map(i => ({ 
      ...i,
      category: i.source, 
      type: 'income'
    }))
  ].sort((a, b) => {
    const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
    if (dateDiff !== 0) return dateDiff;
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  });

  let cashExpenses = 0, onlineExpenses = 0;
  for (const e of allExpenses) {
    if (e.paymentMethod === 'cash') cashExpenses += parseFloat(e.amount);
    else onlineExpenses += parseFloat(e.amount);
  }
  let cashIncomes = 0, onlineIncomes = 0;
  for (const i of allIncomes) {
    if (i.paymentMethod === 'cash') cashIncomes += parseFloat(i.amount);
    else onlineIncomes += parseFloat(i.amount);
  }
  const cashBalance = parseFloat(user.initialCashBalance || "0") + cashIncomes - cashExpenses;
  const onlineBalance = parseFloat(user.initialOnlineBalance || "0") + onlineIncomes - onlineExpenses;

  return (
    <DashboardClient 
      user={user}
      month={month}
      totalBudget={totalBudget}
      totalSpent={totalSpent}
      totalIncome={totalIncome}
      totalSaved={totalSaved}
      cashBalance={cashBalance}
      onlineBalance={onlineBalance}
      categoryBreakdown={categoryBreakdown}
      dailyTotals={dailyTotals}
      categoryLimits={categoryLimits}
      recentExpenses={allTransactions.slice(0, 5)}
      allExpenses={allTransactions}
      catBudgets={catBudgets}
      categories={customCats}
      sips={userSips}
      goals={userGoals}
      recharges={userRecharges}
    />
  );
}
