import { pgTable, uuid, text, numeric, timestamp, date, integer } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  clerkUserId: text("clerk_user_id").unique().notNull(),
  monthlyBudget: numeric("monthly_budget", { precision: 10, scale: 2 }).default("0"),
  initialCashBalance: numeric("initial_cash_balance", { precision: 10, scale: 2 }).default("0"),
  initialOnlineBalance: numeric("initial_online_balance", { precision: 10, scale: 2 }).default("0"),
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
  paymentMethod: text("payment_method").default("online").notNull(),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const incomes = pgTable("incomes", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  source: text("source").notNull(),
  date: date("date").notNull(),
  note: text("note"),
  paymentMethod: text("payment_method").default("online").notNull(),
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

export const recurringExpenses = pgTable("recurring_expenses", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  deductionDate: integer("deduction_date").notNull(),
  paymentMethod: text("payment_method").default("online").notNull(),
  lastProcessed: timestamp("last_processed"),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const goals = pgTable("goals", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  targetAmount: numeric("target_amount", { precision: 10, scale: 2 }).notNull(),
  currentAmount: numeric("current_amount", { precision: 10, scale: 2 }).default("0").notNull(),
  icon: text("icon").default("🎯").notNull(),
  deadline: date("deadline"),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const recharges = pgTable("recharges", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).default("0").notNull(),
  validityDays: integer("validity_days").default(28).notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  endpoint: text("endpoint").unique().notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const debts = pgTable("debts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  personName: text("person_name").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  type: text("type").notNull(),
  status: text("status").default("pending").notNull(),
  paymentMethod: text("payment_method").default("online").notNull(),
  dueDate: date("due_date"),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export type User = typeof users.$inferSelect;
export type UserCategory = typeof userCategories.$inferSelect;
export type Expense = typeof expenses.$inferSelect;
export type Income = typeof incomes.$inferSelect;
export type CategoryBudget = typeof categoryBudgets.$inferSelect;
export type RecurringExpense = typeof recurringExpenses.$inferSelect;
export type Goal = typeof goals.$inferSelect;
export type Recharge = typeof recharges.$inferSelect;
export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type Debt = typeof debts.$inferSelect;

export type NewExpense = typeof expenses.$inferInsert;
export type NewIncome = typeof incomes.$inferInsert;
export type NewGoal = typeof goals.$inferInsert;
export type NewRecharge = typeof recharges.$inferInsert;
export type NewPushSubscription = typeof pushSubscriptions.$inferInsert;
export type NewDebt = typeof debts.$inferInsert;
