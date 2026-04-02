import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, incomes } from "@/lib/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { getMonthString } from "@/lib/utils";

async function getOrCreateUser(clerkUserId: string) {
  const existing = await db.select().from(users).where(eq(users.clerkUserId, clerkUserId)).limit(1);
  if (existing.length > 0) return existing[0];
  try {
    const created = await db.insert(users).values({ clerkUserId }).returning();
    return created[0];
  } catch (error: any) {
    if (error.code === '23505' || (error.message && error.message.includes('unique constraint'))) {
      const retry = await db.select().from(users).where(eq(users.clerkUserId, clerkUserId)).limit(1);
      return retry[0];
    }
    throw error;
  }
}

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getOrCreateUser(userId);
  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month") ?? getMonthString();

  const [year, mon] = month.split("-");
  const startDate = `${year}-${mon}-01`;
  const endDate = `${year}-${mon}-${new Date(Number(year), Number(mon), 0).getDate()}`;

  let query = db
    .select()
    .from(incomes)
    .where(
      and(
        eq(incomes.userId, user.id),
        gte(incomes.date, startDate),
        lte(incomes.date, endDate)
      )
    )
    .orderBy(sql`${incomes.date} DESC, ${incomes.createdAt} DESC`);

  const data = await query;
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getOrCreateUser(userId);
  const body = await request.json();
  const { amount, source, date, note, paymentMethod } = body;

  if (!amount || amount <= 0) return NextResponse.json({ error: "Amount must be > 0" }, { status: 400 });
  if (!source) return NextResponse.json({ error: "Source is required" }, { status: 400 });
  if (!date) return NextResponse.json({ error: "Date is required" }, { status: 400 });

  const created = await db.insert(incomes).values({
    userId: user.id,
    amount: String(amount),
    source,
    date,
    note: note ?? null,
    paymentMethod: paymentMethod ?? "online",
  }).returning();

  return NextResponse.json(created[0], { status: 201 });
}
