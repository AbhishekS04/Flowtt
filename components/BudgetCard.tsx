"use client";

import { formatCurrency } from "@/lib/utils";

interface BudgetCardProps {
  totalBudget: number;
  totalSpent: number;
}

export default function BudgetCard({ totalBudget, totalSpent }: BudgetCardProps) {
  const remaining = totalBudget - totalSpent;
  const pct = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;

  const barColor = pct >= 100 ? "#ffffff" : "#a3a3a3";

  return (
    <div className="bg-card border border-border p-6 sm:p-8 shadow-none relative transition-colors">
      <h2 className="text-[10px] font-bold text-text-muted mb-6 tracking-widest uppercase">Budget Overview</h2>
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div>
          <p className="text-[10px] text-text-muted mb-1 font-bold uppercase tracking-widest">Total</p>
          <p className="text-xl font-bold text-text-primary tracking-tighter">{formatCurrency(totalBudget)}</p>
        </div>
        <div>
          <p className="text-[10px] text-text-muted mb-1 font-bold uppercase tracking-widest">Spent</p>
          <p className="text-xl font-bold text-text-primary tracking-tighter">{formatCurrency(totalSpent)}</p>
        </div>
        <div>
          <p className="text-[10px] text-text-muted mb-1 font-bold uppercase tracking-widest">Remaining</p>
          <p
            className={`text-xl font-bold tracking-tighter ${remaining < 0 ? "text-primary" : "text-text-primary"}`}
          >
            {formatCurrency(Math.abs(remaining))}
            {remaining < 0 && <span className="text-[10px] uppercase font-bold ml-1 tracking-widest border border-primary px-1">over</span>}
          </p>
        </div>
      </div>
      <div className="w-full bg-transparent rounded-none h-1 border border-border relative overflow-hidden">
        <div
          className="h-full rounded-none transition-all duration-700 ease-out"
          style={{ width: `${pct}%`, backgroundColor: barColor }}
        />
      </div>
      <p className="text-[10px] text-text-muted mt-4 font-bold uppercase tracking-widest flex items-center gap-2">
        <span className="inline-block w-1.5 h-1.5 rounded-none bg-text-muted"></span>
        {Math.round(pct)}% Utilized
      </p>
    </div>
  );
}
