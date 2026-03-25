import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { debts, expenses, incomes, users } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await db.query.users.findFirst({
      where: eq(users.clerkUserId, clerkUserId),
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { id } = params;
    const body = await req.json();
    const { action } = body; // 'settle' or 'cancel'

    if (!['settle', 'cancel'].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const debt = await db.query.debts.findFirst({
      where: and(eq(debts.id, id), eq(debts.userId, user.id)),
    });

    if (!debt) return NextResponse.json({ error: "Debt not found" }, { status: 404 });
    if (debt.status !== 'pending') return NextResponse.json({ error: "Debt is already processed" }, { status: 400 });

    if (action === 'cancel') {
      const [updated] = await db.update(debts)
        .set({ status: 'cancelled' })
        .where(eq(debts.id, id))
        .returning();
      return NextResponse.json(updated);
    }

    if (action === 'settle') {
      const tzOffset = (new Date()).getTimezoneOffset() * 60000;
      const today = (new Date(Date.now() - tzOffset)).toISOString().split("T")[0];

      if (debt.type === 'lent') {
        // You lent money, now you are getting it back -> Income
        await db.insert(incomes).values({
          userId: user.id,
          amount: debt.amount,
          source: `Settled Debt: ${debt.personName}`,
          date: today,
          paymentMethod: debt.paymentMethod,
        });
      } else if (debt.type === 'borrowed') {
        // You borrowed money, now you are paying it back -> Expense
        await db.insert(expenses).values({
          userId: user.id,
          amount: debt.amount,
          category: "Debt ✨", // Using a nice category name with emoji that might work without an icon
          date: today,
          note: `Settled Debt to ${debt.personName}`,
          paymentMethod: debt.paymentMethod,
        });
      }

      const [updated] = await db.update(debts)
        .set({ status: 'settled' })
        .where(eq(debts.id, id))
        .returning();
      return NextResponse.json(updated);
    }

  } catch (error) {
    console.error("Error updating debt:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
