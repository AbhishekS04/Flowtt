import { pgTable, uuid, text, numeric, timestamp, date } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  clerkUserId: text("clerk_user_id").unique().notNull(),
  monthlyBudget: numeric("monthly_budget", { precision: 10, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const userCategories = pgTable("user_categories", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  icon: text("icon").notNull(),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const expenses = pgTable("expenses", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  category: text("category").notNull(),
  date: date("date").notNull(),
  note: text("note"),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const categoryBudgets = pgTable("category_budgets", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  category: text("category").notNull(),
  limitAmount: numeric("limit_amount", { precision: 10, scale: 2 }).notNull(),
  month: text("month").notNull(),
});

export type User = typeof users.$inferSelect;
export type UserCategory = typeof userCategories.$inferSelect;
export type Expense = typeof expenses.$inferSelect;
export type CategoryBudget = typeof categoryBudgets.$inferSelect;
export type NewExpense = typeof expenses.$inferInsert;
