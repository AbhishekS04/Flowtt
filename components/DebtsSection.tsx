"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Debt } from "@/lib/schema";

export default function DebtsSection() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [form, setForm] = useState({
    personName: "",
    amount: "",
    type: "lent", // "lent" (you gave) or "borrowed" (you took)
    paymentMethod: "online",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchDebts();
  }, []);

  const fetchDebts = async () => {
    try {
      const res = await fetch("/api/debts");
      if (res.ok) {
        const data = await res.json();
        setDebts(data);
      }
    } catch (error) {
      console.error("Failed to fetch debts", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.personName || !form.amount) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/debts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          amount: parseFloat(form.amount),
        }),
      });

      if (res.ok) {
        const newDebt = await res.json();
        setDebts([newDebt, ...debts]);
        setForm({ personName: "", amount: "", type: "lent", paymentMethod: "online" });
        setIsAddOpen(false);
        toast.success("Settlement record added!");
      } else {
        toast.error("Failed to add record");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAction = async (id: string, action: "settle" | "cancel") => {
    const previousDebts = [...debts];
    setDebts((prev) => prev.map(d => d.id === id ? { ...d, status: action === "settle" ? "settled" : "cancelled" } : d));

    try {
      const res = await fetch(`/api/debts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (res.ok) {
        toast.success(action === "settle" ? "Settled and balance updated!" : "Cancelled.");
        setTimeout(() => window.location.reload(), 800); 
      } else {
        setDebts(previousDebts);
        toast.error("Failed to update");
      }
    } catch (error) {
      setDebts(previousDebts);
      toast.error("An error occurred");
    }
  };

  const pendingDebts = debts.filter(d => d.status === "pending");
  const totalLent = pendingDebts.filter(d => d.type === "lent").reduce((sum, d) => sum + parseFloat(d.amount as any), 0);
  const totalBorrowed = pendingDebts.filter(d => d.type === "borrowed").reduce((sum, d) => sum + parseFloat(d.amount as any), 0);

  return (
    <div className="space-y-8 animate-fade-in relative z-10 w-full mb-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tighter text-text-primary">Give & Take.</h2>
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] mt-1">Settlements with friends</p>
        </div>
        <button 
          onClick={() => setIsAddOpen(true)}
          className="bg-text-primary text-bg font-bold px-6 py-2.5 rounded-full transition-all text-[10px] tracking-widest uppercase shadow-xl active:scale-95"
        >
          + NEW ENTRY
        </button>
      </div>

      {/* Combined Summary Card */}
      <div className="bg-card border border-border rounded-[2rem] p-1 shadow-sm overflow-hidden text-center">
        <div className="grid grid-cols-2 divide-x divide-border/50">
          <div className="p-4 md:p-8 flex flex-col items-center justify-center transition-colors">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-[0.3em] mb-2 md:mb-3">Incoming</span>
            <p className="text-2xl md:text-4xl font-black tracking-tighter text-green-500">
              ₹{totalLent.toLocaleString()}
            </p>
            <p className="text-[8px] md:text-[9px] font-bold text-text-muted uppercase tracking-widest mt-1 md:mt-2 opacity-60">You're owed</p>
          </div>
          <div className="p-4 md:p-8 flex flex-col items-center justify-center transition-colors">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-[0.3em] mb-2 md:mb-3">Outgoing</span>
            <p className="text-2xl md:text-4xl font-black tracking-tighter text-red-500">
              ₹{totalBorrowed.toLocaleString()}
            </p>
            <p className="text-[8px] md:text-[9px] font-bold text-text-muted uppercase tracking-widest mt-1 md:mt-2 opacity-60">You owe</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : pendingDebts.length === 0 ? (
        <div className="bg-card/30 border border-dashed border-border p-12 rounded-[2.5rem] shadow-sm text-center">
          <div className="w-16 h-16 bg-card border border-border rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✨</span>
          </div>
          <p className="text-base font-bold text-text-primary tracking-tight">All Settled Up.</p>
          <p className="text-[10px] font-bold text-text-muted mt-2 uppercase tracking-[0.2em] opacity-60">Your ledger is perfectly balanced</p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] px-2">Active Settlements ({pendingDebts.length})</p>
          <AnimatePresence mode="popLayout">
            {pendingDebts.map((debt) => (
              <motion.div
                key={debt.id}
                layout
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, filter: "brightness(1.5) blur(8px)", transition: { duration: 0.3 } }}
                className="bg-card border border-border p-5 rounded-[1.5rem] flex items-center justify-between shadow-sm relative overflow-hidden transition-all"
              >
                <div className="flex items-center gap-5 relative z-10 w-full overflow-hidden">
                  <div className={`w-14 h-14 min-w-[3.5rem] rounded-2xl flex items-center justify-center text-2xl shadow-inner transition-transform ${debt.type === 'lent' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                    {debt.type === 'lent' ? '📈' : '📉'}
                  </div>
                  <div className="min-w-0 pr-4">
                    <h3 className="font-bold text-text-primary text-base tracking-tight truncate">{debt.personName}</h3>
                    <div className="flex items-center gap-2 mt-1">
                       <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${debt.type === 'lent' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                         {debt.type === 'lent' ? 'To Get' : 'To Give'}
                       </span>
                       <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest opacity-60">
                         {debt.paymentMethod}
                       </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-6 relative z-10">
                  <div className="text-right whitespace-nowrap">
                    <p className={`font-black text-xl md:text-2xl tracking-tighter ${debt.type === 'lent' ? 'text-green-500' : 'text-red-500'}`}>
                      ₹{parseFloat(debt.amount as any).toLocaleString()}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAction(debt.id, "settle")}
                      className="w-10 h-10 rounded-xl bg-text-primary text-bg flex items-center justify-center active:scale-90 transition-all shadow-lg shadow-black/5"
                      title="Settle"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </button>
                    <button
                      onClick={() => handleAction(debt.id, "cancel")}
                      className="w-10 h-10 rounded-xl bg-border/40 text-text-muted flex items-center justify-center active:scale-90 transition-all"
                      title="Dismiss"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add Settlement Modal */}
      <AnimatePresence>
        {isAddOpen && (
          <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-bg/90 backdrop-blur-md" 
              onClick={() => setIsAddOpen(false)}
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="relative w-full md:w-[450px] bg-card border border-border md:rounded-[3rem] rounded-t-[3rem] p-10 shadow-2xl overflow-y-auto max-h-[95vh] no-scrollbar"
            >
              <div className="absolute top-0 right-0 p-8 opacity-5 -z-0">
                <span className="text-9xl font-black italic">±</span>
              </div>
              
              <div className="flex items-center justify-between mb-8 md:mb-10 relative z-10">
                <div>
                  <h3 className="text-2xl md:text-3xl font-black tracking-tighter">New Entry.</h3>
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] mt-1">Split or Settlement</p>
                </div>
                <button onClick={() => setIsAddOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-2xl bg-border/50 text-text-muted transition-all text-sm">✕</button>
              </div>
              
              <form onSubmit={handleAdd} className="space-y-6 md:space-y-8 relative z-10 pb-36 md:pb-0">
                <div className="flex bg-text-primary/5 p-1.5 rounded-[1.5rem] w-full border border-border/10">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, type: "lent" })}
                    className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${form.type === "lent" ? "bg-text-primary text-bg shadow-xl" : "text-text-muted"}`}
                  >
                    I Gave
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, type: "borrowed" })}
                    className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${form.type === "borrowed" ? "bg-text-primary text-bg shadow-xl" : "text-text-muted"}`}
                  >
                    I Took
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] px-1">Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="w-full bg-transparent border-b-2 border-border py-4 text-4xl font-black tracking-tight focus:outline-none focus:border-primary transition-all placeholder:text-text-muted/20"
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] px-1">Friend's Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Who is this with?"
                    value={form.personName}
                    onChange={(e) => setForm({ ...form, personName: e.target.value })}
                    className="w-full bg-transparent border-b-2 border-border py-3 text-xl font-bold focus:outline-none focus:border-primary transition-all placeholder:text-text-muted/20"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] px-1">Settlement via</label>
                  <div className="flex gap-4">
                    {['online', 'cash'].map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setForm({ ...form, paymentMethod: method })}
                        className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${form.paymentMethod === method ? "bg-text-primary text-bg border-text-primary" : "border-border text-text-muted"}`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-text-primary text-bg font-black rounded-3xl py-4 md:py-5 text-[10px] uppercase tracking-[0.3em] transition-all active:scale-[0.98] disabled:opacity-50 mt-4 shadow-2xl shadow-black/20"
                >
                  {isSubmitting ? "Saving Ledger..." : "Add to Ledger"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
