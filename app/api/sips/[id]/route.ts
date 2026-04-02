import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { recurringExpenses, users } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.query.users.findFirst({
    where: eq(users.clerkUserId, clerkUserId)
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  await db.delete(recurringExpenses)
    .where(and(eq(recurringExpenses.id, id), eq(recurringExpenses.userId, user.id)));

  return NextResponse.json({ success: true });
}
