import { Expense } from "@/lib/schema";
import { formatCurrency, getCategoryIcon } from "@/lib/utils";

interface RecentExpensesProps {
  expenses: Expense[];
  categories: { id: string; name: string; icon: string }[];
}

export default function RecentExpenses({ expenses, categories }: RecentExpensesProps) {
  const getIcon = (catName: string) => {
    const custom = categories.find((c) => c.name.toLowerCase() === catName.toLowerCase());
    return custom ? custom.icon : getCategoryIcon(catName);
  };
  return (
    <div className="bg-card border border-border p-6 md:p-8 shadow-none transition-colors">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-[10px] font-bold text-text-muted tracking-widest uppercase">Recent Expenses</h2>
      </div>

      {expenses.length === 0 ? (
        <div className="text-center py-10 text-text-muted text-[10px] tracking-widest uppercase font-bold border border-border">
          No expenses yet.
        </div>
      ) : (
        <div className="space-y-0">
          {expenses.slice(0, 5).map((expense, idx) => (
            <div
              key={expense.id}
              className={`flex items-center justify-between py-4 group/item cursor-default ${
                idx !== expenses.slice(0, 5).length - 1 ? "border-b border-border/50" : ""
              }`}
            >
              <div className="flex items-center gap-4">
                <span className="w-10 h-10 bg-transparent border border-border flex items-center justify-center text-lg group-hover/item:border-text-muted transition-colors">
                  {getIcon(expense.category)}
                </span>
                <div>
                  <p className="text-sm font-bold text-text-primary capitalize tracking-tight mb-0.5">
                    {expense.note || expense.category}
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">{expense.date}</p>
                </div>
              </div>
              <p className="text-base font-bold text-text-primary tracking-tighter">
                {formatCurrency(expense.amount)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
