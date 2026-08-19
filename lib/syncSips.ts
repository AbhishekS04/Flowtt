import { db } from "./db";
import { recurringExpenses, expenses, recharges } from "./schema";
import { eq, and } from "drizzle-orm";

export async function syncUserSIPs(userId: string) {
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  // 1. Sync SIP Investments
  const userSips = await db
    .select()
    .from(recurringExpenses)
    .where(eq(recurringExpenses.userId, userId));

  for (const sip of userSips) {
    if (currentDay >= sip.deductionDate) {
      let needsProcessing = true;
      
      if (sip.lastProcessed) {
        const lastProcessedDate = new Date(sip.lastProcessed);
        if (
          lastProcessedDate.getMonth() === currentMonth &&
          lastProcessedDate.getFullYear() === currentYear
        ) {
          needsProcessing = false; // Already processed this month
        }
      }

      if (needsProcessing) {
        // Create the expense record acting as the automated deduction
        const deductionDateStr = new Date(Date.UTC(currentYear, currentMonth, sip.deductionDate)).toISOString().split('T')[0];
        
        await db.insert(expenses).values({
          userId,
          amount: sip.amount,
          category: "Investments",
          date: deductionDateStr,
          note: `Automated SIP: ${sip.name}`,
          paymentMethod: sip.paymentMethod || 'online',
        });

        // Mark as processed today
        await db.update(recurringExpenses)
          .set({ lastProcessed: new Date() })
          .where(eq(recurringExpenses.id, sip.id));
      }
    }
  }

  // 2. Sync Subscription & Recharge Autopay (e.g. Apple Music, Netflix, Telecom)
  const tzOffset = (new Date()).getTimezoneOffset() * 60000;
  const todayStr = new Date(Date.now() - tzOffset).toISOString().split("T")[0];

  const userRecharges = await db
    .select()
    .from(recharges)
    .where(eq(recharges.userId, userId));

  for (const plan of userRecharges) {
    // If current date has reached or passed the plan's due/end date
    if (plan.endDate && plan.endDate <= todayStr) {
      const planAmount = parseFloat(plan.amount as any || 0);
      if (planAmount > 0) {
        const autopayNote = `Autopay: ${plan.name}`;
        
        // Check if deduction already made for this specific billing cycle end date
        const existingDeduction = await db
          .select()
          .from(expenses)
          .where(
            and(
              eq(expenses.userId, userId),
              eq(expenses.date, plan.endDate),
              eq(expenses.note, autopayNote)
            )
          )
          .limit(1);

        if (existingDeduction.length === 0) {
          // Auto debit the amount online (allows balance to become negative if insufficient funds)
          await db.insert(expenses).values({
            userId,
            amount: plan.amount,
            category: "entertainment",
            date: plan.endDate,
            note: autopayNote,
            paymentMethod: "online",
          });

          // Advance billing cycle to next month / next period
          const [y, m, d] = plan.endDate.split("-").map(Number);
          const nextCycleDate = new Date(y, m - 1, d);
          
          if (plan.validityDays && plan.validityDays >= 28) {
            nextCycleDate.setMonth(nextCycleDate.getMonth() + 1);
          } else {
            nextCycleDate.setDate(nextCycleDate.getDate() + (plan.validityDays || 30));
          }

          const nextEndDateStr = new Date(nextCycleDate.getTime() - tzOffset)
            .toISOString()
            .split("T")[0];

          await db
            .update(recharges)
            .set({
              startDate: plan.endDate,
              endDate: nextEndDateStr,
            })
            .where(eq(recharges.id, plan.id));
        }
      }
    }
  }
}
