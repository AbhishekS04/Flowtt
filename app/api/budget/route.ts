import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { monthlyBudget } = await request.json();
  if (monthlyBudget === undefined || monthlyBudget < 0)
    return NextResponse.json({ error: "Invalid budget amount" }, { status: 400 });

  const existing = await db.select().from(users).where(eq(users.clerkUserId, userId)).limit(1);

  if (existing.length > 0) {
    const updated = await db
      .update(users)
      .set({ monthlyBudget: String(monthlyBudget) })
      .where(eq(users.clerkUserId, userId))
      .returning();
    return NextResponse.json(updated[0]);
  } else {
    const created = await db
      .insert(users)
      .values({ clerkUserId: userId, monthlyBudget: String(monthlyBudget) })
      .returning();
    return NextResponse.json(created[0], { status: 201 });
  }
}
