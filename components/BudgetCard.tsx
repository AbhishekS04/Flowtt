"use client";

import { formatCurrency } from "@/lib/utils";

interface BudgetCardProps {
  totalBudget: number;
  totalSpent: number;
}

export default function BudgetCard({ totalBudget, totalSpent }: BudgetCardProps) {
  if (totalBudget <= 0) {
    return (
      <div className="bg-card border border-dashed border-border p-6 sm:p-8 rounded-3xl shadow-sm relative transition-colors flex flex-col items-center justify-center text-center">
        <span className="text-4xl opacity-50 mb-4">🎯</span>
        <p className="text-lg font-bold text-text-primary tracking-tighter">No Monthly Budget Set</p>
        <p className="text-[10px] text-text-muted mt-2 font-bold uppercase tracking-[0.2em]">
          Go to Settings to establish your spending limit
        </p>
      </div>
    );
  }

  const remaining = totalBudget - totalSpent;
  const pct = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;

  const barColor = pct >= 100 ? "#ffffff" : "#a3a3a3";

  return (
    <div className="bg-card border border-border p-6 sm:p-8 rounded-3xl shadow-sm relative transition-colors">
      <h2 className="text-[10px] font-bold text-text-muted mb-6 tracking-widest uppercase">Budget Overview</h2>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 sm:gap-4 mb-8">
        <div className="flex-1">
          <p className="text-[10px] text-text-muted mb-1 font-bold uppercase tracking-widest">Total</p>
          <p className="text-xl font-bold text-text-primary tracking-tighter">{formatCurrency(totalBudget)}</p>
        </div>
        <div className="flex-1">
          <p className="text-[10px] text-text-muted mb-1 font-bold uppercase tracking-widest">Spent</p>
          <p className="text-xl font-bold text-text-primary tracking-tighter">{formatCurrency(totalSpent)}</p>
        </div>
        <div className="flex-1">
          <p className="text-[10px] text-text-muted mb-1 font-bold uppercase tracking-widest">Remaining</p>
          <p
            className={`text-xl font-bold tracking-tighter ${remaining < 0 ? "text-primary" : "text-text-primary"}`}
          >
            {formatCurrency(Math.abs(remaining))}
            {remaining < 0 && <span className="text-[10px] uppercase font-bold ml-2 tracking-widest border border-primary px-1">over</span>}
          </p>
        </div>
      </div>
      <div className="w-full bg-border/30 rounded-full h-2 relative overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%`, backgroundColor: barColor }}
        />
      </div>
      <p className="text-[10px] text-text-muted mt-4 font-bold uppercase tracking-widest flex items-center gap-2">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-text-muted"></span>
        {Math.round(pct)}% Utilized
      </p>
    </div>
  );
}
