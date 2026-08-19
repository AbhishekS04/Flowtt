"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

interface QuickSplitModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: { id: string; name: string; icon: string }[];
  onSuccess?: () => void;
}

export default function QuickSplitModal({ isOpen, onClose, categories, onSuccess }: QuickSplitModalProps) {
  const tzOffset = new Date().getTimezoneOffset() * 60000;
  const today = new Date(Date.now() - tzOffset).toISOString().split("T")[0];

  const [title, setTitle] = useState("Auto / Toto ride");
  const [category, setCategory] = useState("transport");
  const [totalAmount, setTotalAmount] = useState("40");
  const [numPeople, setNumPeople] = useState("2");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "online">("cash");
  const [friendName, setFriendName] = useState("Priyanshu");
  const [friendPaidUpfront, setFriendPaidUpfront] = useState("10");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculations
  const total = parseFloat(totalAmount) || 0;
  const count = Math.max(1, parseInt(numPeople, 10) || 2);
  const myShare = total > 0 ? total / count : 0;
  const friendTotalShare = total > 0 ? total - myShare : 0;
  const upfrontPaid = parseFloat(friendPaidUpfront) || 0;
  const friendOwesMe = Math.max(0, friendTotalShare - upfrontPaid);

  const presets = [
    { label: "🛺 Auto / Toto", title: "Auto / Toto ride", cat: "transport" },
    { label: "☕ Chai & Snacks", title: "Chai & Snacks", cat: "food" },
    { label: "🍔 Lunch / Dinner", title: "Lunch / Dinner", cat: "food" },
    { label: "🛍️ Group Shopping", title: "Shared Shopping", cat: "shopping" },
  ];

  const handlePreset = (preset: typeof presets[0]) => {
    setTitle(preset.title);
    setCategory(preset.cat);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!total || total <= 0) {
      toast.error("Please enter a valid total amount");
      return;
    }
    if (!friendName.trim()) {
      toast.error("Please enter friend's name");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Record your personal actual share as an Expense
      if (myShare > 0) {
        await fetch("/api/expenses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: myShare,
            category: category || "other",
            date: today,
            note: `${title} (My share of ₹${total})`,
            paymentMethod,
          }),
        });
      }

      // 2. If friend still owes you money, record in "I Will Get" (debts)
      if (friendOwesMe > 0) {
        await fetch("/api/debts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            personName: friendName.trim(),
            amount: friendOwesMe,
            type: "lent", // I Will Get
            paymentMethod,
            syncBalance: false, // Balance was already fronted/spent during the real expense
          }),
        });
      }

      toast.success(
        `Recorded: ₹${myShare.toFixed(2)} expense & ₹${friendOwesMe.toFixed(2)} to get from ${friendName}!`
      );
      onClose();
      if (onSuccess) onSuccess();
      setTimeout(() => window.location.reload(), 700);
    } catch (err) {
      toast.error("Failed to save split transaction");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-end md:items-center justify-center p-0 md:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-bg/90 backdrop-blur-md"
            onClick={onClose}
          />

          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="relative w-full md:w-[480px] bg-card border border-border md:rounded-[3rem] rounded-t-[3rem] p-7 md:p-10 shadow-2xl overflow-y-auto max-h-[95vh] no-scrollbar"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">⚡</span>
                  <h3 className="text-2xl font-black tracking-tight text-text-primary">Quick Split & Fare.</h3>
                </div>
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] mt-0.5">
                  Split auto, chai, or group bills in seconds
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 flex items-center justify-center rounded-2xl bg-border/50 text-text-muted transition-all text-sm hover:text-text-primary"
              >
                ✕
              </button>
            </div>

            {/* Presets */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-6 no-scrollbar">
              {presets.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => handlePreset(p)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider whitespace-nowrap border transition-all ${
                    title === p.title
                      ? "bg-text-primary text-bg border-text-primary"
                      : "border-border text-text-muted hover:border-text-primary/40"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSave} className="space-y-6 pb-28 md:pb-0">
              {/* Total Bill & People */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">
                    Total Bill / Fare (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    placeholder="40"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    className="w-full bg-transparent border-b-2 border-border py-2 text-2xl font-black text-text-primary focus:outline-none focus:border-primary"
                    autoFocus
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">
                    Split Across
                  </label>
                  <div className="flex items-center gap-2 pt-1">
                    {[2, 3, 4].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setNumPeople(String(num))}
                        className={`flex-1 py-2 rounded-xl text-xs font-black border transition-all ${
                          numPeople === String(num)
                            ? "bg-text-primary text-bg border-text-primary"
                            : "border-border text-text-muted"
                        }`}
                      >
                        {num} ppl
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">
                  How did you pay the merchant?
                </label>
                <div className="flex gap-3">
                  {(["cash", "online"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMethod(m)}
                      className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                        paymentMethod === m
                          ? "bg-text-primary text-bg border-text-primary"
                          : "border-border text-text-muted"
                      }`}
                    >
                      {m === "cash" ? "💵 Cash" : "📱 UPI / Online"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Friend's Share & Cash in Hand */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">
                    Friend's Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="E.g. Priyanshu"
                    value={friendName}
                    onChange={(e) => setFriendName(e.target.value)}
                    className="w-full bg-transparent border-b-2 border-border py-2 text-sm font-bold text-text-primary focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">
                    Cash Friend Gave Now (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0"
                    value={friendPaidUpfront}
                    onChange={(e) => setFriendPaidUpfront(e.target.value)}
                    className="w-full bg-transparent border-b-2 border-border py-2 text-sm font-bold text-text-primary focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Live Calculation Preview Card */}
              <div className="bg-text-primary/5 border border-border/80 rounded-3xl p-5 space-y-3">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-border/50">
                  <span className="font-bold text-text-muted uppercase text-[9px] tracking-widest">
                    Your Actual Expense
                  </span>
                  <span className="font-black text-base text-red-500">-{formatCurrency(myShare)}</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-text-muted uppercase text-[9px] tracking-widest">
                    Friend's Total Share
                  </span>
                  <span className="font-bold text-text-primary">{formatCurrency(friendTotalShare)}</span>
                </div>

                {upfrontPaid > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-text-muted uppercase text-[9px] tracking-widest">
                      Minus Cash Paid Upfront
                    </span>
                    <span className="font-bold text-green-500">-{formatCurrency(upfrontPaid)}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <span className="font-black text-text-primary uppercase text-[10px] tracking-widest">
                    Add to "I Will Get" ({friendName || "Friend"})
                  </span>
                  <span className="font-black text-base text-green-500">
                    +{formatCurrency(friendOwesMe)}
                  </span>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-text-primary text-bg font-black rounded-3xl py-4 text-[10px] uppercase tracking-[0.3em] transition-all active:scale-[0.98] disabled:opacity-50 shadow-xl"
              >
                {isSubmitting ? "Calculating & Saving..." : "✅ Record Split & Ledger"}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
