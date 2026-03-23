import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { goals, users } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userRecord = await db.select().from(users).where(eq(users.clerkUserId, clerkUserId)).limit(1);
    if (!userRecord.length) return NextResponse.json({ error: "User not found" }, { status: 404 });
    const internalUserId = userRecord[0].id;

    const { name, targetAmount, icon, deadline } = await req.json();

    const newGoal = await db.insert(goals).values({
      userId: internalUserId,
      name,
      targetAmount: targetAmount.toString(),
      currentAmount: "0",
      icon: icon || "🎯",
      deadline: deadline ? new Date(deadline).toISOString() : null,
    }).returning();

    return NextResponse.json(newGoal[0]);
  } catch (error) {
    console.error("Goals POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
