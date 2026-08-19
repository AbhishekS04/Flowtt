import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { debts, users, expenses, incomes } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await db.query.users.findFirst({
      where: eq(users.clerkUserId, clerkUserId),
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const allDebts = await db.query.debts.findMany({
      where: eq(debts.userId, user.id),
      orderBy: (debts, { desc }) => [desc(debts.createdAt)],
    });

    return NextResponse.json(allDebts);
  } catch (error) {
    console.error("Error fetching debts:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await db.query.users.findFirst({
      where: eq(users.clerkUserId, clerkUserId),
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const body = await req.json();
    const { personName, amount, type, paymentMethod, dueDate, syncBalance } = body;

    if (!personName || !amount || !type || !paymentMethod) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const [newDebt] = await db.insert(debts).values({
      userId: user.id,
      personName,
      amount: amount.toString(),
      type,
      status: 'pending',
      paymentMethod,
      dueDate: dueDate || null,
    }).returning();

    // If syncBalance is enabled (default), update wallet balance and log transaction
    if (syncBalance !== false) {
      const tzOffset = (new Date()).getTimezoneOffset() * 60000;
      const today = (new Date(Date.now() - tzOffset)).toISOString().split("T")[0];

      if (type === 'lent') {
        // User gave money to someone -> records money leaving wallet
        await db.insert(expenses).values({
          userId: user.id,
          amount: amount.toString(),
          category: "Lent / Given 🤝",
          date: today,
          note: `Lent to ${personName}`,
          paymentMethod,
        });
      } else if (type === 'borrowed') {
        // User received money from someone -> records money entering wallet
        await db.insert(incomes).values({
          userId: user.id,
          amount: amount.toString(),
          source: `Borrowed: ${personName}`,
          date: today,
          note: `Borrowed from ${personName}`,
          paymentMethod,
        });
      }
    }

    return NextResponse.json(newDebt);
  } catch (error) {
    console.error("Error creating debt:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

