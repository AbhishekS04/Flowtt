import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, expenses } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

async function getUser(clerkUserId: string) {
  const result = await db.select().from(users).where(eq(users.clerkUserId, clerkUserId)).limit(1);
  return result[0] ?? null;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getUser(userId);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await request.json();
  const { amount, category, date, note, paymentMethod } = body;

  const updated = await db
    .update(expenses)
    .set({
      ...(amount !== undefined && { amount: String(amount) }),
      ...(category !== undefined && { category }),
      ...(date !== undefined && { date }),
      ...(note !== undefined && { note }),
      ...(paymentMethod !== undefined && { paymentMethod }),
    })
    .where(and(eq(expenses.id, id), eq(expenses.userId, user.id)))
    .returning();

  if (!updated.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated[0]);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getUser(userId);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  await db.delete(expenses).where(and(eq(expenses.id, id), eq(expenses.userId, user.id)));
  return NextResponse.json({ success: true });
}
