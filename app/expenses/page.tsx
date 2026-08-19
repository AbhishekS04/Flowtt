import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { users, expenses, incomes, userCategories } from "@/lib/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { getMonthString } from "@/lib/utils";
import Navbar from "@/components/Navbar";
import ExpenseTable from "@/components/ExpenseTable";

export default async function ExpensesPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const existing = await db.select().from(users).where(eq(users.clerkUserId, userId)).limit(1);
  if (!existing.length) redirect("/dashboard");

  const user = existing[0];
  const month = getMonthString();
  const [year, mon] = month.split("-");
  const startDate = `${year}-${mon}-01`;
  const endDate = `${year}-${mon}-${new Date(Number(year), Number(mon), 0).getDate()}`;

  const [monthExpenses, monthIncomes, categories] = await Promise.all([
    db
      .select()
      .from(expenses)
      .where(and(eq(expenses.userId, user.id), gte(expenses.date, startDate), lte(expenses.date, endDate))),
    db
      .select()
      .from(incomes)
      .where(and(eq(incomes.userId, user.id), gte(incomes.date, startDate), lte(incomes.date, endDate))),
    db
      .select({ id: userCategories.id, name: userCategories.name, icon: userCategories.icon })
      .from(userCategories)
      .where(eq(userCategories.userId, user.id)),
  ]);

  const initialTransactions = [
    ...monthExpenses.map((e) => ({ ...e, type: "expense" })),
    ...monthIncomes.map((i) => ({
      ...i,
      category: i.source,
      type: "income",
    })),
  ].sort((a, b) => {
    const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
    if (dateDiff !== 0) return dateDiff;
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  });

  return (
    <div className="min-h-screen bg-bg">
      <Navbar />
      <main className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-8 pb-28 md:pb-12">
        <div className="mb-6 px-1">
          <h1 className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight">Expenses & Transactions</h1>
          <p className="text-xs text-text-muted mt-1 font-medium">
            Daily timeline, cash & online segregated feed, and full transaction history.
          </p>
        </div>
        <div className="bg-card border border-border rounded-2xl sm:rounded-3xl p-4 sm:p-7 shadow-sm overflow-hidden">
          <ExpenseTable initialExpenses={initialTransactions} categories={categories} />
        </div>
      </main>
    </div>
  );
}
