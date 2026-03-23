import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { goals, users } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userRecord = await db.select().from(users).where(eq(users.clerkUserId, clerkUserId)).limit(1);
    if (!userRecord.length) return NextResponse.json({ error: "User not found" }, { status: 404 });
    const internalUserId = userRecord[0].id;

    const { currentAmount } = await req.json();

    const updated = await db.update(goals)
      .set({ currentAmount: currentAmount.toString() })
      .where(and(eq(goals.id, params.id), eq(goals.userId, internalUserId)))
      .returning();

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error("Goals PATCH error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userRecord = await db.select().from(users).where(eq(users.clerkUserId, clerkUserId)).limit(1);
    if (!userRecord.length) return NextResponse.json({ error: "User not found" }, { status: 404 });
    const internalUserId = userRecord[0].id;

    await db.delete(goals).where(and(eq(goals.id, params.id), eq(goals.userId, internalUserId)));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Goals DELETE error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
