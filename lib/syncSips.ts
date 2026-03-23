import { db } from "./db";
import { recurringExpenses, expenses } from "./schema";
import { eq } from "drizzle-orm";

export async function syncUserSIPs(userId: string) {
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
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
        // We use the exact deduction date for the current month
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
}
