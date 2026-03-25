import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { debts, users } from "@/lib/schema";
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
    const { personName, amount, type, paymentMethod, dueDate } = body;

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

    return NextResponse.json(newDebt);
  } catch (error) {
    console.error("Error creating debt:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
