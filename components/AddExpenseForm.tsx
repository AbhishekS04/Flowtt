"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface AddExpenseFormProps {
  onSuccess?: () => void;
  categories: { id: string; name: string; icon: string }[];
}

export default function AddExpenseForm({ onSuccess, categories }: AddExpenseFormProps) {
  const router = useRouter();
  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState({
    amount: "",
    category: "",
    date: today,
    note: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.amount || parseFloat(form.amount) <= 0) errs.amount = "Required";
    if (!form.category) errs.category = "Required";
    if (!form.date) errs.date = "Required";
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setLoading(true);
    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: parseFloat(form.amount),
        category: form.category,
        date: form.date,
        note: form.note || null,
      }),
    });

    setLoading(false);
    if (res.ok) {
      toast.success("Expense added");
      setForm({ amount: "", category: "", date: today, note: "" });
      if (onSuccess) onSuccess();
      else router.push("/dashboard");
    } else {
      const data = await res.json();
      toast.error(data.error ?? "Failed to add expense");
    }
  };

  const field = (label: string, children: React.ReactNode, error?: string) => (
    <div className="flex flex-col gap-2 w-full">
      <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest transition-colors group-focus-within:text-primary">
        {label}
      </label>
      <div className="relative group">{children}</div>
      {error && <p className="text-xs text-text-muted mt-1 font-medium">{error}</p>}
    </div>
  );

  const inputClass =
    "w-full bg-transparent border-b border-border text-text-primary px-0 py-2 text-xl focus:outline-none focus:border-primary transition-colors placeholder:text-text-muted/30 rounded-none appearance-none";

  return (
    <form onSubmit={handleSubmit} className="space-y-10 group/form">
      <div>
        <h2 className="text-3xl font-bold tracking-tighter text-text-primary">
          New Expense.
        </h2>
        <p className="text-text-muted text-sm mt-2">Record a transaction.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        {field(
          "Amount (₹)",
          <input
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            value={form.amount}
            onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
            className={inputClass + " font-bold"}
            autoFocus
          />,
          errors.amount
        )}

        {field(
          "Category",
          <select
            value={form.category}
            onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
            className={inputClass + " cursor-pointer"}
          >
            <option value="" disabled className="text-text-muted/50 hidden">Select</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name} className="text-text-primary bg-bg text-base">
                {c.icon} {c.name.charAt(0).toUpperCase() + c.name.slice(1)}
              </option>
            ))}
          </select>,
          errors.category
        )}
      </div>

      {field(
        "Date",
        <input
          type="date"
          value={form.date}
          onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
          className={inputClass + " sm:w-1/2 cursor-pointer w-full"}
        />,
        errors.date
      )}

      {field(
        "Note",
        <input
          type="text"
          placeholder="Optional description"
          value={form.note}
          onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
          className={inputClass}
        />
      )}

      <div className="pt-4">
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-text-primary text-bg shadow-lg shadow-black/10 border-none font-bold rounded-full py-4 text-[10px] uppercase tracking-widest transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? "Saving..." : "SAVE EXPENSE"}
        </button>
      </div>
    </form>
  );
}
