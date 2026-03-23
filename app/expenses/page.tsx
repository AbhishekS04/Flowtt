import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { users, expenses } from "@/lib/schema";
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

  const initialExpenses = await db
    .select()
    .from(expenses)
    .where(and(eq(expenses.userId, user.id), gte(expenses.date, startDate), lte(expenses.date, endDate)));

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-6 pb-20 md:pb-6">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-[#e5e5e5]">Expenses</h1>
          <p className="text-sm text-[#a3a3a3] mt-1">Manage your spending history.</p>
        </div>
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5">
          <ExpenseTable initialExpenses={initialExpenses} />
        </div>
      </main>
    </div>
  );
}
