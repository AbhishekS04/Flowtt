"use client";

import { formatCurrency, getCategoryColor } from "@/lib/utils";

interface CategoryBudgetsCardProps {
  categoryLimits: Record<string, number>;
  categoryBreakdown: Record<string, number>;
  categories: { id: string; name: string; icon: string }[];
}

export default function CategoryBudgetsCard({
  categoryLimits,
  categoryBreakdown,
  categories,
}: CategoryBudgetsCardProps) {
  // Only show categories that have a limit set
  const budgetedCategories = categories.filter(
    (c) => categoryLimits[c.name] && categoryLimits[c.name] > 0
  );

  if (budgetedCategories.length === 0) {
    return null; // Don't show the card if no category budgets are set
  }

  return (
    <div className="bg-card border border-border p-6 sm:p-8 rounded-3xl shadow-sm relative transition-colors">
      <h2 className="text-[10px] font-bold text-text-muted mb-8 tracking-widest uppercase">
        Category Allocations
      </h2>
      <div className="space-y-8">
        {budgetedCategories.map((cat) => {
          const limit = categoryLimits[cat.name];
          const spent = categoryBreakdown[cat.name] || 0;
          const remaining = limit - spent;
          const pct = Math.min((spent / limit) * 100, 100);
          
          // Use green if under 80%, yellow 80-100%, red if over limit
          let barColor = "#4ade80"; // default green
          if (pct >= 80 && pct < 100) barColor = "#facc15"; // warning yellow
          if (pct >= 100) barColor = "#ef4444"; // danger red

          return (
            <div key={cat.id} className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-bg font-bold flex items-center justify-center text-sm shadow-inner">
                    {cat.icon}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-text-primary tracking-widest uppercase">
                      {cat.name}
                    </p>
                    <p className="text-[10px] text-text-muted font-bold tracking-widest uppercase mt-0.5">
                      {formatCurrency(limit)} Limit
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-black tracking-tighter ${remaining < 0 ? "text-red-500" : "text-text-primary"}`}>
                    {remaining < 0 ? "-" : ""}{formatCurrency(Math.abs(remaining))}
                  </p>
                  <p className="text-[10px] text-text-muted font-bold tracking-widest uppercase mt-0.5">
                    {remaining < 0 ? "Overspent" : "Remaining"}
                  </p>
                </div>
              </div>
              <div className="w-full bg-border/40 rounded-full h-1.5 relative overflow-hidden group/bar">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${pct}%`, backgroundColor: barColor }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
