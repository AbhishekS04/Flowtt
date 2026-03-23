import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { userCategories, users } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await db.select().from(users).where(eq(users.clerkUserId, userId)).limit(1);
    if (!user.length) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const body = await req.json();
    const { name, icon } = body;

    if (!name || !icon) {
      return NextResponse.json({ error: "Name and icon are required" }, { status: 400 });
    }

    const created = await db
      .insert(userCategories)
      .values({
        userId: user[0].id,
        name: name.toLowerCase(),
        icon,
      })
      .returning();

    return NextResponse.json(created[0]);
  } catch (error) {
    console.error("Failed to add category:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
