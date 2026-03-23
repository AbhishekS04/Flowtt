"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RecurringExpense } from "@/lib/schema";

interface SipManagerProps {
  sips: RecurringExpense[];
}

export default function SipManager({ sips }: SipManagerProps) {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", amount: "", deductionDate: "7" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.amount || !form.deductionDate) {
      toast.error("Please fill all fields");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/sips", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (res.ok) {
      toast.success("Investment added!");
      setForm({ name: "", amount: "", deductionDate: "7" });
      router.refresh();
    } else {
      toast.error("Failed to add investment");
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/sips/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Investment deleted");
      router.refresh();
    } else {
      toast.error("Failed to delete investment");
    }
  };

  const getOrdinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20 mt-4">
      <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
        <h3 className="text-xl font-bold mb-6 tracking-tighter">New automated investment</h3>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-text-muted ml-1">Investment Name</label>
            <input 
              type="text" 
              placeholder="e.g. SBI Gold Fund" 
              value={form.name} 
              onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
              className="w-full bg-text-primary/5 border border-border/40 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-text-primary transition-colors text-text-primary placeholder:text-text-muted/30"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-text-muted ml-1">Monthly Amount (₹)</label>
            <input 
              type="number" 
              placeholder="5000" 
              value={form.amount} 
              onChange={(e) => setForm(p => ({ ...p, amount: e.target.value }))}
              className="w-full bg-text-primary/5 border border-border/40 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-text-primary transition-colors text-text-primary placeholder:text-text-muted/30 font-bold"
            />
          </div>

          <div className="space-y-4">
            <label className="text-[10px] uppercase font-bold text-text-muted ml-1">
              Deduction Date (Every Month)
            </label>
            <div className="grid grid-cols-7 gap-2 bg-text-primary/10 p-4 rounded-3xl border border-border/40">
              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => setForm(p => ({ ...p, deductionDate: day.toString() }))}
                  className={`h-10 w-full flex items-center justify-center rounded-xl text-xs font-bold transition-all ${
                    form.deductionDate === day.toString()
                      ? "bg-text-primary text-bg shadow-lg scale-105"
                      : "hover:bg-text-primary/10 text-text-muted"
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-center text-text-muted uppercase font-bold tracking-widest">
              Selected: {form.deductionDate}{getOrdinal(parseInt(form.deductionDate))} of every month
            </p>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="mt-2 w-full bg-white text-black font-bold py-4 rounded-full uppercase tracking-widest text-[10px] shadow-lg hover:opacity-90 active:scale-[0.98] transition-all"
          >
            {loading ? "Saving..." : "Save Auto-Deduction"}
          </button>
        </form>
      </div>

      <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
        <h3 className="text-xl font-bold mb-6 tracking-tighter">Active Investments</h3>
        {sips.length === 0 ? (
          <p className="text-text-muted text-sm text-center py-8">No active SIPs found.</p>
        ) : (
          <div className="space-y-4">
            {sips.map((sip) => (
              <div key={sip.id} className="flex items-center justify-between p-4 rounded-2xl bg-bg border border-border/50 group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-purple-500/10 text-purple-500 flex items-center justify-center text-xl">
                    📈
                  </div>
                  <div>
                    <h4 className="font-bold text-sm tracking-tight">{sip.name}</h4>
                    <p className="text-[10px] text-text-muted uppercase font-bold tracking-widest mt-0.5">Every {sip.deductionDate}{getOrdinal(sip.deductionDate)} of month</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-bold text-sm">₹{parseFloat(sip.amount.toString()).toFixed(0)}</span>
                  <button onClick={() => handleDelete(sip.id)} className="p-2 rounded-lg bg-red-500/10 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
