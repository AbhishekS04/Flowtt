import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pushSubscriptions, users } from "@/lib/schema";
import webpush from "web-push";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { clerkClient } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const FALLBACK_MODELS = [
  "gemini-1.5-flash-latest",
  "gemini-1.5-pro-latest",
  "gemini-1.5-flash",
  "gemini-pro",
  "gemini-1.0-pro"
];

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
      let modelsToTry = process.env.GEMINI_MODEL ? [process.env.GEMINI_MODEL, ...FALLBACK_MODELS] : [...FALLBACK_MODELS];
      let aiResponded = false;

      // Automatically dynamically detect models to prevent 404s on newer API versions
      try {
        const availableRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
        if (availableRes.ok) {
          const data = await availableRes.json();
          if (data.models && Array.isArray(data.models)) {
             const dynamicModels = data.models
               .filter((m: any) => m.supportedGenerationMethods?.includes("generateContent") && m.name.includes("gemini"))
               .map((m: any) => m.name.replace("models/", ""));
               
             if (dynamicModels.length > 0) {
               modelsToTry = process.env.GEMINI_MODEL ? [process.env.GEMINI_MODEL, ...dynamicModels] : dynamicModels;
               // Sort so pro/flash show up first
               modelsToTry.sort((a,b) => b.localeCompare(a));
             }
          }
        }
      } catch (listErr) {
        console.warn("[GEMINI_WARN] Failed to auto-detect models, using defaults.", listErr);
      }

      for (const mName of modelsToTry) {
        if (aiResponded) break;
        try {
          const tryModel = genAI.getGenerativeModel({ model: mName });
          const result = await tryModel.generateContent(prompt);
          const response = await result.response;
          if (response.text()) {
            jokeText = response.text().trim().replace(/^["']|["']$/g, '');
            aiResponded = true;
          }
        } catch (aiError: any) {
          console.warn(`[GEMINI_WARN] Model ${mName} failed: ${aiError.message}. Trying next fallback...`);
        }
      }
      
      if (!aiResponded) {
        console.error(`[GEMINI_ERROR] All fallback models failed for ${firstName}`);
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
          await webpush.sendNotification(subscription, payload, { TTL: 3600 });
          console.log(`[PUSH_SENT] Successfully sent to ${sub.endpoint.slice(0, 50)}...`);
        } catch (pushError: any) {
          console.error(`[PUSH_ERROR] Status: ${pushError.statusCode}, Body: ${pushError.body}, Endpoint: ${sub.endpoint.slice(0, 50)}`);
          if (pushError.statusCode === 404 || pushError.statusCode === 410) {
            try {
              await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, sub.endpoint));
              console.log(`[PUSH_CLEANUP] Deleted stale subscription: ${sub.endpoint.slice(0, 50)}`);
            } catch (dbErr) {
              console.error(`[PUSH_CLEANUP_ERROR] Failed to delete stale sub:`, dbErr);
            }
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
