import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { recharges, users } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [user] = await db.select().from(users).where(eq(users.clerkUserId, clerkUserId)).limit(1);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { name, amount, endDate } = await req.json();
    if (!name || !amount || !endDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const start = new Date();
    const startDate = start.toISOString().split("T")[0];
    const validityDays = Math.max(1, Math.ceil((new Date(endDate).getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

    // Delete any existing recharges for this user (only want 1 active at a time)
    await db.delete(recharges).where(eq(recharges.userId, user.id));

    const [newRecharge] = await db.insert(recharges).values({
      userId: user.id,
      name,
      amount: amount.toString(),
      validityDays,
      startDate,
      endDate
    }).returning();

    return NextResponse.json(newRecharge);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
