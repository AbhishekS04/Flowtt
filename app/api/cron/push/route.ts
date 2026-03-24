import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pushSubscriptions, users } from "@/lib/schema";
import webpush from "web-push";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { clerkClient } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const modelName = process.env.GEMINI_MODEL || "gemini-1.5-flash";
const model = genAI.getGenerativeModel({ model: modelName });

// Configure Web Push VAPID keys
webpush.setVapidDetails(
  "mailto:contact@trackrapp.com",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "",
  process.env.VAPID_PRIVATE_KEY || ""
);

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const type = url.searchParams.get("type") || "meme";

    // Retrieve all active push subscriptions joined with their user data
    const subs = await db
      .select({
        endpoint: pushSubscriptions.endpoint,
        p256dh: pushSubscriptions.p256dh,
        auth: pushSubscriptions.auth,
        clerkUserId: users.clerkUserId,
      })
      .from(pushSubscriptions)
      .innerJoin(users, eq(pushSubscriptions.userId, users.id));

    if (subs.length === 0) {
      return NextResponse.json({ success: true, message: "No active subscriptions to notify." });
    }

    // Group subscriptions by clerkUserId to generate only 1 unique joke per user
    const usersSubsMap = new Map<string, typeof subs>();
    for (const sub of subs) {
      if (!usersSubsMap.has(sub.clerkUserId)) {
        usersSubsMap.set(sub.clerkUserId, []);
      }
      usersSubsMap.get(sub.clerkUserId)!.push(sub);
    }

    const clerk = clerkClient();

    const processPromises = Array.from(usersSubsMap.entries()).map(async ([clerkUserId, userEndpoints]) => {
      let firstName = "there";
      try {
        const clerkUser = await clerk.users.getUser(clerkUserId);
        if (clerkUser && clerkUser.firstName) {
          firstName = clerkUser.firstName;
        }
      } catch (e) {
        console.error("Could not fetch user name for", clerkUserId);
      }

      let prompt = "";
      let jokeText = "";

      if (type === "reminder") {
        prompt = `You are a savage, witty budgeting app notification system. The user's name is ${firstName}. It is 7:00 PM. Give me one very short (max 1 sentence) funny notification reminding ${firstName} to log their expenses for the day. Be aggressive but funny. Use their name. No quotes.`;
        jokeText = `Hey ${firstName}, it's 7 PM. Log your expenses today or I will judge you.`;
      } else {
        prompt = `You are a savage, witty budgeting app notification system. The user's name is ${firstName}. Give me one very short (max 1 sentence, under 80 characters) funny meme notification roasting ${firstName} about their spending habits. Use their name. No quotes.`;
        jokeText = `Hey ${firstName}, did you log your expenses today? Don't make me look at your bank account.`;
      }
      try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        if (response.text()) {
          jokeText = response.text().trim().replace(/^["']|["']$/g, '');
        }
      } catch (aiError) {
        console.error(`[GEMINI_ERROR] Fallback to default joke for ${firstName}`, aiError);
      }

      const payload = JSON.stringify({
        title: "Trackr Alert 💸",
        body: jokeText,
      });

      // Send to all their devices
      await Promise.all(userEndpoints.map(async (sub) => {
        const subscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        };
        try {
          await webpush.sendNotification(subscription, payload);
        } catch (pushError: any) {
          if (pushError.statusCode === 404 || pushError.statusCode === 410) {
            await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, sub.endpoint));
          }
        }
      }));
    });

    await Promise.all(processPromises);

    return NextResponse.json({ success: true, usersNotified: usersSubsMap.size, totalPushes: subs.length });
  } catch (error) {
    console.error("[CRON_PUSH_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
