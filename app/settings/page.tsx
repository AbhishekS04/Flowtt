import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { users, categoryBudgets, userCategories } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { getMonthString } from "@/lib/utils";
import Navbar from "@/components/Navbar";
import SettingsForm from "@/components/SettingsForm";

export default async function SettingsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  let user = await db.select().from(users).where(eq(users.clerkUserId, userId)).limit(1).then((r) => r[0]);
  if (!user) {
    const created = await db.insert(users).values({ clerkUserId: userId }).returning();
    user = created[0];
  }

  const month = getMonthString();
  const catBudgets = await db
    .select()
    .from(categoryBudgets)
    .where(and(eq(categoryBudgets.userId, user.id), eq(categoryBudgets.month, month)));

  const categories = await db
    .select({ id: userCategories.id, name: userCategories.name, icon: userCategories.icon })
    .from(userCategories)
    .where(eq(userCategories.userId, user.id));

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-6 pb-20 md:pb-6">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-[#e5e5e5]">Settings</h1>
          <p className="text-sm text-[#a3a3a3] mt-1">Manage your budget and preferences.</p>
        </div>
        <SettingsForm
          initialBudget={parseFloat(user.monthlyBudget ?? "0")}
          initialCategoryBudgets={catBudgets.map((cb) => ({
            category: cb.category,
            limitAmount: cb.limitAmount,
          }))}
          categories={categories}
        />
      </main>
    </div>
  );
}
