import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";

export async function GET(req: NextRequest) {
  try {
    // Test basic connection
    const result = await db.select().from(users).limit(1);
    
    return NextResponse.json({
      status: "success",
      message: "Database connection successful",
      usersCount: result.length,
    });
  } catch (error) {
    console.error("Database test failed:", error);
    
    return NextResponse.json(
      {
        status: "error",
        message: "Database connection failed",
        error: error instanceof Error ? error.message : String(error),
        databaseUrl: process.env.DATABASE_URL?.substring(0, 50) + "...",
      },
      { status: 500 }
    );
  }
}
