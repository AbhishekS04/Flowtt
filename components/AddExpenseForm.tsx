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
    source: "",
    date: today,
    note: "",
  });
  const [type, setType] = useState<"expense" | "income">("expense");
  const [paymentMethod, setPaymentMethod] = useState<"online" | "cash">("online");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.amount || parseFloat(form.amount) <= 0) errs.amount = "Required";
    if (type === "expense" && !form.category) errs.category = "Required";
    if (type === "income" && !form.source) errs.source = "Required";
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

    const isExpense = type === "expense";
    const endpoint = isExpense ? "/api/expenses" : "/api/incomes";
    const body: Record<string, any> = {
      amount: parseFloat(form.amount),
      date: form.date,
      note: form.note || null,
      paymentMethod,
    };

    if (isExpense) body.category = form.category;
    else body.source = form.source;

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setLoading(false);
    if (res.ok) {
      toast.success(isExpense ? "Expense added" : "Income added");
      setForm({ amount: "", category: "", source: "", date: today, note: "" });
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

  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const selectedCategory = categories.find((c) => c.name === form.category);

  return (
    <form onSubmit={handleSubmit} className="space-y-12 group/form">
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-4xl font-bold tracking-tighter text-text-primary leading-none">
            New Transaction.
          </h2>
          <p className="text-text-muted text-sm font-medium mt-2">Record a transaction in seconds.</p>
        </div>

        {/* Toggles */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex bg-text-primary/5 p-1 rounded-full w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setType("expense")}
              className={`flex-1 sm:px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${type === "expense" ? "bg-text-primary text-bg shadow-sm" : "text-text-muted hover:text-text-primary"}`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => setType("income")}
              className={`flex-1 sm:px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${type === "income" ? "bg-text-primary text-bg shadow-sm" : "text-text-muted hover:text-text-primary"}`}
            >
              Income
            </button>
          </div>

          <div className="flex bg-text-primary/5 p-1 rounded-full w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setPaymentMethod("online")}
              className={`flex-1 sm:px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${paymentMethod === "online" ? "bg-text-primary text-bg shadow-sm" : "text-text-muted hover:text-text-primary"}`}
            >
              Online
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod("cash")}
              className={`flex-1 sm:px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${paymentMethod === "cash" ? "bg-text-primary text-bg shadow-sm" : "text-text-muted hover:text-text-primary"}`}
            >
              Cash
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
        {field(
          "Amount (₹)",
          <input
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            value={form.amount}
            onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
            className={inputClass + " font-bold text-2xl"}
            autoFocus
          />,
          errors.amount
        )}

        {type === "expense" ? (
          field(
            "Category",
            <div className="relative group/select">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(!isOpen);
                  if (!isOpen) setSearch("");
                }}
                className={`${inputClass} flex items-center justify-between group-focus-within/select:border-primary transition-all duration-300`}
              >
                <div className="flex items-center gap-4">
                  {selectedCategory ? (
                    <>
                      <span className="text-2xl transition-transform group-hover:scale-110 duration-300">{selectedCategory.icon}</span>
                      <span className="font-bold tracking-tight text-text-primary uppercase text-xs tracking-widest">{selectedCategory.name}</span>
                    </>
                  ) : (
                    <span className="text-text-muted/40 font-bold uppercase text-[10px] tracking-[0.2em]">Search Category...</span>
                  )}
                </div>
                <svg 
                  className={`w-3.5 h-3.5 text-text-muted transition-transform duration-500 ease-out ${isOpen ? "rotate-180 text-primary" : ""}`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40 bg-transparent" 
                    onClick={() => setIsOpen(false)}
                  />
                  <div className="absolute top-full left-0 right-0 mt-3 z-50 bg-card border border-border/80 shadow-[0_20px_60px_rgba(0,0,0,0.6)] rounded-3xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300 ease-out">
                    <div className="p-3 border-b border-border/50">
                      <input
                        type="text"
                        placeholder="Search for category..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-text-primary/5 border border-border/40 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-text-primary/30 transition-all placeholder:text-text-muted/40 font-medium"
                        autoFocus
                      />
                    </div>
                    <div className="max-h-64 overflow-y-auto py-2 custom-scrollbar">
                      {filteredCategories.length > 0 ? (
                        filteredCategories.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setForm(p => ({ ...p, category: c.name }));
                              setIsOpen(false);
                              setSearch("");
                            }}
                            className={`w-full flex items-center gap-4 px-5 py-4 text-left transition-all duration-300 group/option ${
                              form.category === c.name 
                                ? "bg-text-primary text-bg" 
                                : "hover:bg-text-primary/5 text-text-primary"
                            }`}
                          >
                            <span className={`text-2xl transition-transform duration-500 ${form.category === c.name ? "scale-100" : "group-hover/option:scale-125 group-hover/option:rotate-12"}`}>{c.icon}</span>
                            <span className="font-bold text-[10px] uppercase tracking-[0.2em] leading-none flex-1">{c.name}</span>
                            {form.category === c.name && (
                              <div className="w-1.5 h-1.5 rounded-full bg-bg shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                            )}
                          </button>
                        ))
                      ) : (
                        <div className="px-5 py-8 text-center">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted opacity-50">No results</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>,
            errors.category
          )
        ) : (
          field(
            "Source",
            <input
              type="text"
              placeholder="E.g. Salary, Gift"
              value={form.source}
              onChange={(e) => setForm((p) => ({ ...p, source: e.target.value }))}
              className={inputClass + " font-bold text-lg"}
            />,
            errors.source
          )
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
        {field(
          "Date",
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
            className={inputClass + " cursor-pointer uppercase font-bold text-[10px] tracking-widest"}
          />,
          errors.date
        )}

        {field(
          "Note",
          <input
            type="text"
            placeholder="What was this for?"
            value={form.note}
            onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
            className={inputClass + " text-sm font-medium"}
          />
        )}
      </div>

      <div className="pt-4">
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-text-primary text-bg shadow-lg shadow-black/10 border-none font-bold rounded-full py-4 text-[10px] uppercase tracking-widest transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? "Saving..." : `SAVE ${type.toUpperCase()}`}
        </button>
      </div>
    </form>
  );
}
