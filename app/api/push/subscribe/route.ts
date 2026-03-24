import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pushSubscriptions } from "@/lib/schema";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const subscription = await req.json();

    // Check if subscription already exists for this endpoint
    const existing = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.endpoint, subscription.endpoint));

    if (existing.length === 0) {
      await db.insert(pushSubscriptions).values({
        userId,
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
    const { userId } = auth();
    if (!userId) {
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
