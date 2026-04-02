import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pushSubscriptions, users } from "@/lib/schema";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const localUser = await db.select({ id: users.id }).from(users).where(eq(users.clerkUserId, clerkUserId));
    if (localUser.length === 0) {
      return new NextResponse("User not found in DB", { status: 404 });
    }
    const localUserId = localUser[0].id;

    const subscription = await req.json();

    // Check if subscription already exists for this endpoint
    const existing = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.endpoint, subscription.endpoint));

    if (existing.length === 0) {
      await db.insert(pushSubscriptions).values({
        userId: localUserId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PUSH_SUBSCRIBE_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { endpoint } = await req.json();

    await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PUSH_SUBSCRIBE_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
