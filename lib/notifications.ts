import { getDaysRemainingInMonth } from "./utils";

export interface BudgetAlertData {
  totalBudget: number;
  totalSpent: number;
  categorySpending: Record<string, number>;
  categoryLimits: Record<string, number>;
}

export interface Alert {
  type: "error" | "warning" | "success";
  message: string;
  priority: number; // higher = more critical
}

export function checkBudgetAlerts(data: BudgetAlertData): Alert[] {
  const alerts: Alert[] = [];
  const { totalBudget, totalSpent, categorySpending, categoryLimits } = data;
  const daysLeft = getDaysRemainingInMonth();

  if (totalBudget > 0) {
    const pct = totalSpent / totalBudget;
    if (pct >= 1) {
      alerts.push({
        type: "error",
        message: "🚨 You've exceeded your monthly budget.",
        priority: 100,
      });
    } else if (pct >= 0.8) {
      alerts.push({
        type: "warning",
        message: `⚠️ You've used ${Math.round(pct * 100)}% of your budget. Consider slowing down.`,
        priority: 80,
      });
    } else if (pct < 0.3 && daysLeft > 15) {
      alerts.push({
        type: "success",
        message: "✅ You're on track this month. Keep it up.",
        priority: 10,
      });
    }
  }

  for (const [category, limit] of Object.entries(categoryLimits)) {
    if (limit > 0) {
      const spent = categorySpending[category] ?? 0;
      if (spent / limit >= 0.7) {
        alerts.push({
          type: "warning",
          message: `⚠️ You're overspending on ${category.charAt(0).toUpperCase() + category.slice(1)}.`,
          priority: 60,
        });
      }
    }
  }

  return alerts.sort((a, b) => b.priority - a.priority);
}
