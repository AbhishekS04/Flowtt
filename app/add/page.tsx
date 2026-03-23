import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { users, userCategories } from "@/lib/schema";
import { eq } from "drizzle-orm";
import Navbar from "@/components/Navbar";
import AddExpenseForm from "@/components/AddExpenseForm";

async function getCategories(clerkUserId: string) {
  const [user] = await db.select().from(users).where(eq(users.clerkUserId, clerkUserId)).limit(1);
  if (!user) return [];
  return db.select().from(userCategories).where(eq(userCategories.userId, user.id));
}

export default async function AddPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const categories = await getCategories(userId);

  return (
    <div className="min-h-screen bg-bg">
      <Navbar />
      <main className="max-w-xl mx-auto px-6 py-12">
        <div className="bg-card border border-border rounded-3xl p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-text-primary/10" />
          <AddExpenseForm 
            categories={categories}
            onSuccess={async () => {
              "use server";
              redirect("/dashboard");
            }} 
          />
        </div>
      </main>
    </div>
  );
}
