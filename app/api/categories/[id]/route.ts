import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { userCategories, users } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await db.select().from(users).where(eq(users.clerkUserId, userId)).limit(1);
    if (!user.length) return NextResponse.json({ error: "User not found" }, { status: 404 });

    await db.delete(userCategories).where(
      and(eq(userCategories.id, id), eq(userCategories.userId, user[0].id))
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete category:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await db.select().from(users).where(eq(users.clerkUserId, userId)).limit(1);
    if (!user.length) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const body = await req.json();
    const { name, icon } = body;

    const updated = await db
      .update(userCategories)
      .set({
        ...(name && { name: name.toLowerCase() }),
        ...(icon && { icon }),
      })
      .where(and(eq(userCategories.id, id), eq(userCategories.userId, user[0].id)))
      .returning();

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error("Failed to update category:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
