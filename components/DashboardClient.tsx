"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { UserButton } from "@clerk/nextjs";
import BudgetCard from "@/components/BudgetCard";
import NotificationBanner from "@/components/NotificationBanner";
import DonutChart from "@/components/DonutChart";
import DailyBarChart from "@/components/BarChart";
import RecentExpenses from "@/components/RecentExpenses";
import ExpenseTable from "@/components/ExpenseTable";
import SettingsForm from "@/components/SettingsForm";
import AddExpenseForm from "@/components/AddExpenseForm";
import SipManager from "@/components/SipManager";
import { Expense, RecurringExpense } from "@/lib/schema";

interface DashboardClientProps {
  user: any;
  month: string;
  totalBudget: number;
  totalSpent: number;
  totalIncome: number;
  totalSaved: number;
  cashBalance: number;
  onlineBalance: number;
  categoryBreakdown: Record<string, number>;
  dailyTotals: Record<string, number>;
  categoryLimits: Record<string, number>;
  recentExpenses: Expense[];
  allExpenses: Expense[];
  catBudgets: any[];
  categories: { id: string; name: string; icon: string }[];
  sips: RecurringExpense[];
}

export default function DashboardClient({
  user,
  month,
  totalBudget,
  totalSpent,
  totalIncome,
  totalSaved,
  cashBalance,
  onlineBalance,
  categoryBreakdown,
  dailyTotals,
  categoryLimits,
  recentExpenses,
  allExpenses,
  catBudgets,
  categories,
  sips,
}: DashboardClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "expenses" | "sips" | "settings">("overview");
  const [isAddOpen, setIsAddOpen] = useState(false);

  const staticPrimaryColor = "bg-text-primary text-bg shadow-lg shadow-black/10 border-none font-bold transition-all active:scale-95";
  const beautifulGradient = "bg-text-primary text-bg shadow-lg shadow-black/10 border-none";

  const todayDate = new Date().getDate();
  const upcomingSips = sips.filter(s => s.deductionDate >= todayDate).sort((a,b) => a.deductionDate - b.deductionDate);
  const nextSip = upcomingSips[0] || [...sips].sort((a,b) => a.deductionDate - b.deductionDate)[0];

  const getOrdinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  };

  return (
    <div className="min-h-screen bg-bg text-text-primary flex flex-col md:pb-0 font-sans selection:bg-purple-500 selection:text-white">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-bg/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tighter leading-none">Trackr.</h1>
            <p suppressHydrationWarning className="text-[10px] uppercase tracking-[0.2em] text-text-muted mt-0.5 font-bold">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" })}
            </p>
          </div>
          <div className="flex items-center gap-5">
            <button 
              onClick={() => setIsAddOpen(true)}
              className={`hidden md:flex items-center justify-center font-bold px-6 py-2 rounded-full hover:opacity-90 transition-opacity text-xs tracking-widest uppercase ${staticPrimaryColor}`}
            >
              + ADD
            </button>
            <div className="ring-1 ring-border rounded-full p-0.5">
              <UserButton appearance={{ elements: { avatarBox: "w-8 h-8" } }} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-32 animate-fade-in relative">
        {activeTab === "overview" && (
          <div className="space-y-8 animate-fade-in">
            {/* Account Balances (Replaced white banner) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-card border border-border p-6 rounded-3xl shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                  <span className="text-6xl">💵</span>
                </div>
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] mb-1">Cash Balance</p>
                <p className="text-4xl font-black tracking-tighter text-text-primary mb-2">₹{cashBalance.toFixed(2)}</p>
                <p className="text-xs text-text-muted font-bold tracking-widest uppercase">
                  Spent this month: <span className="text-text-primary">₹{allExpenses.filter(e => e.paymentMethod === 'cash').reduce((sum, e) => sum + parseFloat(e.amount), 0).toFixed(2)}</span>
                </p>
              </div>
              <div className="bg-card border border-border p-6 rounded-3xl shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                  <span className="text-6xl">💳</span>
                </div>
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] mb-1">Online Balance</p>
                <p className="text-4xl font-black tracking-tighter text-text-primary mb-2">₹{onlineBalance.toFixed(2)}</p>
                <p className="text-xs text-text-muted font-bold tracking-widest uppercase">
                  Spent this month: <span className="text-text-primary">₹{allExpenses.filter(e => e.paymentMethod === 'online').reduce((sum, e) => sum + parseFloat(e.amount), 0).toFixed(2)}</span>
                </p>
              </div>
            </div>

            {/* Upcoming SIP Card */}
            {nextSip && (
              <div className="bg-text-primary text-bg border border-border p-6 rounded-3xl shadow-2xl relative overflow-hidden group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-bg text-text-primary flex items-center justify-center text-2xl shadow-inner animate-pulse">
                      ⏰
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-bg/70 uppercase tracking-[0.2em] mb-1">Upcoming Sync</p>
                      <p className="text-xl font-bold tracking-tighter">{nextSip.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black tracking-tighter">₹{parseFloat(nextSip.amount as any).toFixed(2)}</p>
                    <p className="text-[10px] uppercase font-bold tracking-widest text-bg/70 mt-1">Due {nextSip.deductionDate}{getOrdinal(nextSip.deductionDate)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Monthly Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-card border border-border p-6 rounded-3xl shadow-sm">
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] mb-1">Earned this month</p>
                <p className="text-3xl font-black tracking-tighter text-text-primary">₹{totalIncome.toFixed(2)}</p>
              </div>
              <div className="bg-card border border-border p-6 rounded-3xl shadow-sm">
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] mb-1">Spent this month</p>
                <p className="text-3xl font-black tracking-tighter text-text-primary">₹{totalSpent.toFixed(2)}</p>
              </div>
              <div className="bg-card border border-border p-6 rounded-3xl shadow-sm">
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] mb-1">Saved this month</p>
                <p className={`text-3xl font-black tracking-tighter ${totalSaved >= 0 ? "text-green-500" : "text-red-500"}`}>
                  ₹{Math.abs(totalSaved).toFixed(2)}
                </p>
              </div>
            </div>

            <BudgetCard totalBudget={totalBudget} totalSpent={totalSpent} />
            <NotificationBanner data={{ totalBudget: totalBudget, totalSpent: totalSpent, categorySpending: categoryBreakdown, categoryLimits: categoryLimits }} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <DonutChart categoryBreakdown={categoryBreakdown} />
              <DailyBarChart dailyTotals={dailyTotals} month={month} />
            </div>
            <RecentExpenses expenses={recentExpenses} categories={categories} />
          </div>
        )}
        
        {activeTab === "expenses" && (
          <div className="animate-fade-in space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold tracking-tighter">Transactions</h2>
            </div>
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
              <ExpenseTable initialExpenses={allExpenses} categories={categories} />
            </div>
          </div>
        )}

        {activeTab === "sips" && (
          <div className="animate-fade-in space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold tracking-tighter">Investments</h2>
            </div>
            <SipManager sips={sips} />
          </div>
        )}

        {activeTab === "settings" && (
          <div className="animate-fade-in space-y-6 max-w-2xl mx-auto mt-4">
            <h2 className="text-2xl font-bold tracking-tighter mb-8">Preferences</h2>
            <SettingsForm 
              initialBudget={totalBudget}
              initialCash={parseFloat(user.initialCashBalance || "0")}
              initialOnline={parseFloat(user.initialOnlineBalance || "0")}
              initialCategoryBudgets={catBudgets.map((cb: any) => ({ category: cb.category, limitAmount: cb.limitAmount }))}
              categories={categories}
            />
          </div>
        )}
      </main>

      {/* Desktop Tabs */}
      <div className="hidden md:flex fixed bottom-8 left-1/2 -translate-x-1/2 bg-card border border-border p-1 rounded-2xl shadow-2xl z-40 backdrop-blur-xl gap-1">
        {(["overview", "expenses", "sips", "settings"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-7 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300 ${
              activeTab === tab ? "bg-white text-black shadow-sm" : "text-text-muted hover:text-text-primary hover:bg-white/5"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Mobile Bottom Navigation (Floating Capsule) */}
      <nav className="fixed bottom-6 left-4 right-4 z-50 md:hidden">
        <div className="bg-[#1a1a1a]/80 backdrop-blur-3xl border border-white/5 rounded-[2rem] p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex items-center justify-between relative overflow-hidden">
          {([
            { id: "overview", label: "Overview", icon: (isActive: boolean) => <span className={`text-2xl drop-shadow-sm transition-all duration-300 ${isActive ? 'scale-110 grayscale-0' : 'grayscale-[50%] opacity-80'}`}>🏠</span> },
            { id: "expenses", label: "History", icon: (isActive: boolean) => <span className={`text-2xl drop-shadow-sm transition-all duration-300 ${isActive ? 'scale-110 grayscale-0' : 'grayscale-[50%] opacity-80'}`}>📋</span> },
            { id: "sips", label: "Investments", icon: (isActive: boolean) => <span className={`text-2xl drop-shadow-sm transition-all duration-300 ${isActive ? 'scale-110 grayscale-0' : 'grayscale-[50%] opacity-80'}`}>📈</span> },
            { id: "settings", label: "Settings", icon: (isActive: boolean) => <span className={`text-2xl drop-shadow-sm transition-all duration-300 ${isActive ? 'scale-110 grayscale-0' : 'grayscale-[50%] opacity-80'}`}>⚙️</span> },
            { id: "add", label: "Add", icon: (isActive: boolean) => (
              <div className={`w-11 h-11 rounded-full flex items-center justify-center bg-text-primary text-bg shadow-lg transition-transform duration-300 ${isActive ? 'rotate-[135deg] bg-red-400 text-white' : 'hover:scale-105 active:scale-95'}`}>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              </div>
            ) }
          ] as const).map((tab) => {
            const isActive = activeTab === tab.id || (tab.id === 'add' && isAddOpen);
            
            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id === 'add') {
                    setIsAddOpen(!isAddOpen);
                  } else {
                    setActiveTab(tab.id as any);
                    setIsAddOpen(false);
                  }
                }}
                className={`flex flex-col items-center justify-center flex-1 h-14 rounded-full relative z-10 tap-highlight-transparent ${
                  isActive ? "text-bg" : "text-text-muted hover:text-text-primary"
                }`}
              >
                {isActive && tab.id !== 'add' && (
                  <motion.div
                    layoutId="mobile-active-tab"
                    className="absolute inset-0 bg-text-primary rounded-full -z-10 shadow-lg"
                    initial={false}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <div className={`transition-transform duration-300 flex flex-col items-center ${isActive && tab.id !== 'add' ? "-translate-y-0.5" : ""}`}>
                  {tab.icon(isActive)}
                </div>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Add Expense Modal/BottomSheet */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-bg/80 backdrop-blur-sm animate-fade-in" onClick={() => setIsAddOpen(false)}></div>
          <div className="relative w-full md:w-[480px] bg-card border border-border md:rounded-3xl rounded-t-3xl p-8 shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
            <button onClick={() => setIsAddOpen(false)} className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-border text-text-muted hover:text-text-primary transition-colors text-lg leading-none">
              ✕
            </button>
            <div className="mt-2">
              <AddExpenseForm 
                categories={categories}
                onSuccess={() => {
                  setIsAddOpen(false);
                  router.refresh();
                }} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
