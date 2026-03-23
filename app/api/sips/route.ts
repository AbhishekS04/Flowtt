import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { recurringExpenses, users } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.query.users.findFirst({
    where: eq(users.clerkUserId, clerkUserId)
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const sips = await db
    .select()
    .from(recurringExpenses)
    .where(eq(recurringExpenses.userId, user.id))
    .orderBy(recurringExpenses.deductionDate);

  return NextResponse.json(sips);
}

export async function POST(req: Request) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.query.users.findFirst({
    where: eq(users.clerkUserId, clerkUserId)
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await req.json();
  const { name, amount, deductionDate, paymentMethod } = body;

  if (!name || !amount || !deductionDate) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const [sip] = await db.insert(recurringExpenses).values({
    userId: user.id,
    name,
    amount: amount.toString(),
    deductionDate: parseInt(deductionDate),
    paymentMethod: paymentMethod || 'online',
  }).returning();

  return NextResponse.json(sip);
}
