"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Debt } from "@/lib/schema";
import { formatCurrency, formatTransactionDateTime } from "@/lib/utils";

export default function DebtsSection() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [form, setForm] = useState({
    personName: "",
    amount: "",
    type: "lent" as "lent" | "borrowed", // "lent" = I Will Get (I Gave), "borrowed" = I Will Give (I Took)
    paymentMethod: "online",
    dueDate: "",
    syncBalance: true,
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
    if (!form.personName || !form.amount || parseFloat(form.amount) <= 0) {
      toast.error("Please enter a valid name and amount");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/debts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personName: form.personName.trim(),
          amount: parseFloat(form.amount),
          type: form.type,
          paymentMethod: form.paymentMethod,
          dueDate: form.dueDate || null,
          syncBalance: form.syncBalance,
        }),
      });

      if (res.ok) {
        const newDebt = await res.json();
        setDebts([newDebt, ...debts]);
        setForm({
          personName: "",
          amount: "",
          type: "lent",
          paymentMethod: "online",
          dueDate: "",
          syncBalance: true,
        });
        setIsAddOpen(false);
        toast.success(
          form.type === "lent"
            ? `Added! You will get ₹${parseFloat(form.amount).toFixed(2)} from ${form.personName}`
            : `Added! You will give ₹${parseFloat(form.amount).toFixed(2)} to ${form.personName}`
        );
        setTimeout(() => window.location.reload(), 600);
      } else {
        toast.error("Failed to add settlement record");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAction = async (id: string, action: "settle" | "cancel") => {
    const previousDebts = [...debts];
    setDebts((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: action === "settle" ? "settled" : "cancelled" } : d))
    );

    try {
      const res = await fetch(`/api/debts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (res.ok) {
        toast.success(action === "settle" ? "Settled and wallet balance updated!" : "Cancelled record.");
        setTimeout(() => window.location.reload(), 700);
      } else {
        setDebts(previousDebts);
        toast.error("Failed to update settlement");
      }
    } catch (error) {
      setDebts(previousDebts);
      toast.error("An error occurred");
    }
  };

  const pendingDebts = debts.filter((d) => d.status === "pending");
  const totalWillGet = pendingDebts
    .filter((d) => d.type === "lent")
    .reduce((sum, d) => sum + parseFloat(d.amount as any || 0), 0);
  const totalWillGive = pendingDebts
    .filter((d) => d.type === "borrowed")
    .reduce((sum, d) => sum + parseFloat(d.amount as any || 0), 0);
  const netSettlement = totalWillGet - totalWillGive;

  return (
    <div className="space-y-8 animate-fade-in relative z-10 w-full mb-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tighter text-text-primary">I Will Get / I Give.</h2>
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] mt-1">
            Settlements & Peer Ledger
          </p>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="bg-text-primary text-bg font-bold px-6 py-2.5 rounded-full transition-all text-[10px] tracking-widest uppercase shadow-xl active:scale-95 hover:opacity-90"
        >
          + NEW SETTLEMENT
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* I Will Get */}
        <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">I Will Get</span>
            <span className="w-2 h-2 rounded-full bg-green-500" />
          </div>
          <p className="text-3xl font-black tracking-tighter text-green-500">
            +{formatCurrency(totalWillGet)}
          </p>
          <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest mt-1">
            Money given / Friends owe you
          </p>
        </div>

        {/* I Will Give */}
        <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">I Will Give</span>
            <span className="w-2 h-2 rounded-full bg-red-500" />
          </div>
          <p className="text-3xl font-black tracking-tighter text-red-500">
            -{formatCurrency(totalWillGive)}
          </p>
          <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest mt-1">
            Money taken / You owe friends
          </p>
        </div>

        {/* Net Settlement */}
        <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Net Position</span>
            <span className={`w-2 h-2 rounded-full ${netSettlement >= 0 ? "bg-green-500" : "bg-red-500"}`} />
          </div>
          <p
            className={`text-3xl font-black tracking-tighter ${
              netSettlement >= 0 ? "text-text-primary" : "text-red-500"
            }`}
          >
            {netSettlement >= 0 ? "+" : "-"}
            {formatCurrency(Math.abs(netSettlement))}
          </p>
          <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest mt-1">
            {netSettlement >= 0 ? "Net receivable balance" : "Net payable balance"}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : pendingDebts.length === 0 ? (
        <div className="bg-card/30 border border-dashed border-border p-12 rounded-[2.5rem] shadow-sm text-center">
          <div className="w-16 h-16 bg-card border border-border rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🤝</span>
          </div>
          <p className="text-base font-bold text-text-primary tracking-tight">All Settled Up.</p>
          <p className="text-[10px] font-bold text-text-muted mt-2 uppercase tracking-[0.2em] opacity-60">
            No pending settlements with anyone
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] px-2">
            Pending Settlements ({pendingDebts.length})
          </p>
          <AnimatePresence mode="popLayout">
            {pendingDebts.map((debt) => {
              const isLent = debt.type === "lent"; // User will get
              return (
                <motion.div
                  key={debt.id}
                  layout
                  initial={{ opacity: 0, scale: 0.98, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, filter: "brightness(1.5) blur(8px)", transition: { duration: 0.3 } }}
                  className="bg-card border border-border p-5 rounded-[1.5rem] flex items-center justify-between shadow-sm relative overflow-hidden transition-all"
                >
                  <div className="flex items-center gap-5 relative z-10 w-full overflow-hidden">
                    <div
                      className={`w-14 h-14 min-w-[3.5rem] rounded-2xl flex items-center justify-center text-2xl shadow-inner transition-transform ${
                        isLent ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                      }`}
                    >
                      {isLent ? "📥" : "📤"}
                    </div>
                    <div className="min-w-0 pr-4">
                      <h3 className="font-bold text-text-primary text-base tracking-tight truncate">
                        {debt.personName}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span
                          className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full ${
                            isLent
                              ? "bg-green-500/15 text-green-500 border border-green-500/20"
                              : "bg-red-500/15 text-red-500 border border-red-500/20"
                          }`}
                        >
                          {isLent ? "I Will Get" : "I Will Give"}
                        </span>
                        <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest opacity-75">
                          via {debt.paymentMethod}
                        </span>
                        {debt.createdAt && (
                          <span className="text-[9px] font-medium text-text-muted opacity-60">
                            • {formatTransactionDateTime("", debt.createdAt)}
                          </span>
                        )}
                        {debt.dueDate && (
                          <span className="text-[9px] font-bold text-amber-500">
                            • Due {debt.dueDate}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 relative z-10">
                    <div className="text-right whitespace-nowrap">
                      <p
                        className={`font-black text-xl md:text-2xl tracking-tighter ${
                          isLent ? "text-green-500" : "text-red-500"
                        }`}
                      >
                        {isLent ? "+" : "-"}
                        {formatCurrency(debt.amount)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAction(debt.id, "settle")}
                        className="h-10 px-3.5 rounded-xl bg-text-primary text-bg flex items-center justify-center gap-1.5 active:scale-90 transition-all shadow-md font-bold text-[10px] uppercase tracking-widest"
                        title="Mark as Settled"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Settle</span>
                      </button>
                      <button
                        onClick={() => handleAction(debt.id, "cancel")}
                        className="w-10 h-10 rounded-xl bg-border/40 text-text-muted flex items-center justify-center active:scale-90 transition-all hover:text-red-500"
                        title="Dismiss / Cancel"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
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
              className="relative w-full md:w-[460px] bg-card border border-border md:rounded-[3rem] rounded-t-[3rem] p-8 md:p-10 shadow-2xl overflow-y-auto max-h-[95vh] no-scrollbar"
            >
              <div className="flex items-center justify-between mb-8 relative z-10">
                <div>
                  <h3 className="text-2xl md:text-3xl font-black tracking-tighter">New Settlement.</h3>
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] mt-1">
                    Track money to give or get
                  </p>
                </div>
                <button
                  onClick={() => setIsAddOpen(false)}
                  className="w-9 h-9 flex items-center justify-center rounded-2xl bg-border/50 text-text-muted transition-all text-sm hover:text-text-primary"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAdd} className="space-y-6 relative z-10 pb-36 md:pb-0">
                {/* Type toggle */}
                <div className="flex bg-text-primary/5 p-1.5 rounded-[1.5rem] w-full border border-border/20">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, type: "lent" })}
                    className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] transition-all flex flex-col items-center gap-0.5 ${
                      form.type === "lent"
                        ? "bg-green-500 text-white shadow-lg shadow-green-500/20"
                        : "text-text-muted hover:text-text-primary"
                    }`}
                  >
                    <span>I Will Get</span>
                    <span className="text-[8px] font-normal opacity-80">(I Gave Money)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, type: "borrowed" })}
                    className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] transition-all flex flex-col items-center gap-0.5 ${
                      form.type === "borrowed"
                        ? "bg-red-500 text-white shadow-lg shadow-red-500/20"
                        : "text-text-muted hover:text-text-primary"
                    }`}
                  >
                    <span>I Will Give</span>
                    <span className="text-[8px] font-normal opacity-80">(I Took Money)</span>
                  </button>
                </div>

                {/* Amount */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] px-1">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="0.00"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="w-full bg-transparent border-b-2 border-border py-3 text-3xl font-black tracking-tight focus:outline-none focus:border-primary transition-all placeholder:text-text-muted/20"
                    autoFocus
                  />
                </div>

                {/* Friend's Name */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] px-1">
                    Friend's Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="E.g. Rahul, Priya, Alex"
                    value={form.personName}
                    onChange={(e) => setForm({ ...form, personName: e.target.value })}
                    className="w-full bg-transparent border-b-2 border-border py-2 text-lg font-bold focus:outline-none focus:border-primary transition-all placeholder:text-text-muted/20"
                  />
                </div>

                {/* Payment Method */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] px-1">
                    Paid / Received via
                  </label>
                  <div className="flex gap-4">
                    {["online", "cash"].map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setForm({ ...form, paymentMethod: method })}
                        className={`flex-1 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                          form.paymentMethod === method
                            ? "bg-text-primary text-bg border-text-primary shadow-sm"
                            : "border-border text-text-muted"
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Due Date (optional) */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] px-1">
                    Expected Due Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                    className="w-full bg-transparent border-b border-border py-2 text-xs font-bold uppercase tracking-widest text-text-primary focus:outline-none focus:border-primary"
                  />
                </div>

                {/* Balance sync toggle */}
                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="syncBalance"
                    checked={form.syncBalance}
                    onChange={(e) => setForm({ ...form, syncBalance: e.target.checked })}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-0 cursor-pointer accent-primary"
                  />
                  <label htmlFor="syncBalance" className="text-xs text-text-muted font-medium cursor-pointer">
                    Sync with Wallet Balance & log transaction
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-text-primary text-bg font-black rounded-3xl py-4 text-[10px] uppercase tracking-[0.3em] transition-all active:scale-[0.98] disabled:opacity-50 mt-4 shadow-xl"
                >
                  {isSubmitting ? "Recording..." : "Save Settlement"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
