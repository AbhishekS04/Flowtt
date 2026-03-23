import { db } from "./db";
import { users } from "./schema";

export async function testDatabaseConnection() {
  try {
    console.log("🔍 Testing database connection...");
    console.log("DATABASE_URL:", process.env.DATABASE_URL?.substring(0, 50) + "...");

    const result = await db.select().from(users).limit(1);
    console.log("✅ Database connection successful!");
    console.log(`Found ${result.length} users`);
    return { success: true, message: "Database connected" };
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
