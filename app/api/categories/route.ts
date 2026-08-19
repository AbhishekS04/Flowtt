import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { userCategories, users } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await db.select().from(users).where(eq(users.clerkUserId, userId)).limit(1);
    if (!user.length) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const body = await req.json();
    const { name, icon, dailyBudget } = body;

    if (!name || !icon) {
      return NextResponse.json({ error: "Name and icon are required" }, { status: 400 });
    }

    const created = await db
      .insert(userCategories)
      .values({
        userId: user[0].id,
        name: name.toLowerCase(),
        icon,
        dailyBudget: dailyBudget !== undefined && dailyBudget !== null && dailyBudget !== "" ? dailyBudget.toString() : null,
      })
      .returning();

    return NextResponse.json(created[0]);
  } catch (error) {
    console.error("Failed to add category:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await db.select().from(users).where(eq(users.clerkUserId, userId)).limit(1);
    if (!user.length) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const body = await req.json();
    const { dailyBudgets } = body; // Record<string, number | string | null> (category name -> dailyBudget)

    if (dailyBudgets && typeof dailyBudgets === "object") {
      for (const [catName, budgetVal] of Object.entries(dailyBudgets)) {
        const valStr = budgetVal !== "" && budgetVal !== null && budgetVal !== undefined ? String(budgetVal) : null;
        await db
          .update(userCategories)
          .set({ dailyBudget: valStr })
          .where(
            and(
              eq(userCategories.userId, user[0].id),
              eq(userCategories.name, catName.toLowerCase())
            )
          );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update daily budgets:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
