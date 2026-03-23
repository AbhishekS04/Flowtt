"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { UserButton } from "@clerk/nextjs";
import { toast } from "sonner";
import BudgetCard from "@/components/BudgetCard";
import NotificationBanner from "@/components/NotificationBanner";
import DonutChart from "@/components/DonutChart";
import DailyBarChart from "@/components/BarChart";
import RecentExpenses from "@/components/RecentExpenses";
import ExpenseTable from "@/components/ExpenseTable";
import SettingsForm from "@/components/SettingsForm";
import AddExpenseForm from "@/components/AddExpenseForm";
import SipManager from "@/components/SipManager";
import GoalsManager from "@/components/GoalsManager";
import { Expense, RecurringExpense, Goal } from "@/lib/schema";

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
  recentExpenses: any[];
  allExpenses: any[];
  catBudgets: any[];
  categories: { id: string; name: string; icon: string }[];
  sips: RecurringExpense[];
  goals: Goal[];
  recharges: any[];
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
  goals,
  recharges,
}: DashboardClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "expenses" | "goals" | "sips" | "settings">("overview");
  const [isAddOpen, setIsAddOpen] = useState(false);

  const activeRecharge = recharges?.[0] || null;

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
            <UserButton appearance={{ elements: { avatarBox: "w-9 h-9 border border-border" } }} />
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
                <div className="absolute top-0 right-0 p-6 opacity-100 transition-opacity">
                  <span className="text-6xl drop-shadow-sm">💵</span>
                </div>
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] mb-1">Cash Balance</p>
                <p className="text-4xl font-black tracking-tighter text-text-primary mb-2">₹{cashBalance.toFixed(2)}</p>
                <p className="text-xs text-text-muted font-bold tracking-widest uppercase">
                  Spent this month: <span className="text-text-primary">₹{allExpenses.filter(e => e.paymentMethod === 'cash').reduce((sum, e) => sum + parseFloat(e.amount), 0).toFixed(2)}</span>
                </p>
              </div>
              <div className="bg-card border border-border p-6 rounded-3xl shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6 opacity-100 transition-opacity">
                  <span className="text-6xl drop-shadow-sm">💳</span>
                </div>
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] mb-1">Online Balance</p>
                <p className="text-4xl font-black tracking-tighter text-text-primary mb-2">₹{onlineBalance.toFixed(2)}</p>
                <p className="text-xs text-text-muted font-bold tracking-widest uppercase">
                  Spent this month: <span className="text-text-primary">₹{allExpenses.filter(e => e.paymentMethod === 'online').reduce((sum, e) => sum + parseFloat(e.amount), 0).toFixed(2)}</span>
                </p>
              </div>
            </div>

            {/* Upcoming SIP Card */}
            {sips.length > 0 && (
              <div 
                className="bg-card border border-border p-6 rounded-3xl shadow-sm flex items-center justify-between cursor-pointer hover:bg-text-primary/5 transition-all"
                onClick={() => setActiveTab("sips")}
              >
                <div>
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] mb-1">Active Investments</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-black tracking-tighter text-text-primary">
                      {sips.length} {sips.length === 1 ? "SIP" : "SIPs"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black tracking-tighter text-text-primary">
                    ₹{sips.reduce((sum, s) => sum + parseFloat(s.amount as any), 0).toFixed(2)}
                  </p>
                  {nextSip && (
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] mt-1">
                      Next Due: {nextSip.deductionDate}{getOrdinal(nextSip.deductionDate)}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Recharge Card */}
            {activeRecharge ? (() => {
               const start = new Date(activeRecharge.startDate).getTime();
               const end = new Date(activeRecharge.endDate).getTime();
               const today = new Date().getTime();
               const totalDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
               const remainingDays = Math.max(0, Math.ceil((end - today) / (1000 * 60 * 60 * 24)));
               const progress = Math.min(100, Math.max(0, ((totalDays - remainingDays) / totalDays) * 100));
               
               return (
                 <div 
                   className="bg-card border border-border p-6 rounded-3xl shadow-sm relative overflow-hidden group cursor-pointer hover:bg-text-primary/5 transition-all"
                   onClick={() => setActiveTab("settings")}
                 >
                   <div className="absolute top-0 right-0 p-6 opacity-100 transition-opacity">
                     <span className="text-6xl drop-shadow-sm opacity-20">📱</span>
                   </div>
                   <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] mb-1 relative z-10">Active Plan</p>
                   <div className="mb-4 relative z-10">
                     <p className="text-3xl font-black tracking-tighter text-text-primary line-clamp-1">
                       {activeRecharge.name}
                     </p>
                     <p className="text-[10px] font-bold text-text-muted mt-1 uppercase tracking-widest">
                       ₹{parseFloat(activeRecharge.amount).toFixed(2)} • {activeRecharge.validityDays} Days Validity
                     </p>
                   </div>
                   <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-text-muted mb-2 relative z-10">
                     <span className={remainingDays <= 3 ? "text-red-500" : ""}>{remainingDays} {remainingDays === 1 ? "Day" : "Days"} Left</span>
                     <span>Ends {activeRecharge.endDate}</span>
                   </div>
                   <div className="h-2 w-full bg-border rounded-full overflow-hidden relative z-10">
                     <div 
                       className={`h-full rounded-full transition-all duration-1000 ${remainingDays <= 3 ? "bg-red-500" : "bg-text-primary"}`} 
                       style={{ width: `${progress}%` }} 
                     />
                   </div>
                 </div>
               );
            })() : (
               <div 
                 className="bg-card border border-dashed border-border p-6 rounded-3xl shadow-sm relative overflow-hidden group cursor-pointer hover:bg-text-primary/5 transition-all flex flex-col items-center justify-center text-center py-10"
                 onClick={() => setActiveTab("settings")}
               >
                 <span className="text-4xl opacity-50 mb-2">📱</span>
                 <p className="text-sm font-bold text-text-primary">No Active Recharge</p>
                 <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">Tap to track your plan</p>
               </div>
            )}

            {/* Monthly Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-card border border-border p-6 rounded-3xl shadow-sm">
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] mb-1">Earned this month</p>
                <p className="text-3xl font-black tracking-tighter text-green-500">+₹{totalIncome.toFixed(2)}</p>
              </div>
              <div className="bg-card border border-border p-6 rounded-3xl shadow-sm">
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] mb-1">Spent this month</p>
                <p className="text-3xl font-black tracking-tighter text-red-500">-₹{totalSpent.toFixed(2)}</p>
              </div>
              <div className="bg-card border border-border p-6 rounded-3xl shadow-sm">
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] mb-1">
                  {totalSaved >= 0 ? "Saved this month" : "Overspent this month"}
                </p>
                <p className={`text-3xl font-black tracking-tighter ${totalSaved >= 0 ? "text-green-500" : "text-red-500"}`}>
                  {totalSaved >= 0 ? "+" : "-"}₹{Math.abs(totalSaved).toFixed(2)}
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

        {activeTab === "goals" && (
          <div className="animate-fade-in space-y-6">
            <GoalsManager initialGoals={goals} />
          </div>
        )}

        {activeTab === "settings" && (
          <div className="animate-fade-in space-y-6 max-w-2xl mx-auto mt-4">
            <h2 className="text-2xl font-bold tracking-tighter mb-8">Preferences</h2>
            <SettingsForm 
              initialBudget={totalBudget}
              initialCash={parseFloat(user.initialCashBalance || "0")}
              initialOnline={parseFloat(user.initialOnlineBalance || "0")}
              initialCategoryBudgets={catBudgets.map(cb => ({ category: cb.category, limitAmount: cb.limitAmount }))}
              categories={categories}
              initialRecharge={activeRecharge}
            />
          </div>
        )}
      </main>

      {/* Desktop Tabs */}
      <div className="hidden md:flex fixed bottom-8 left-1/2 -translate-x-1/2 bg-card border border-border p-1 rounded-2xl shadow-2xl z-40 backdrop-blur-xl gap-1">
        {(["overview", "expenses", "goals", "sips", "settings"] as const).map((tab) => (
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
            { id: "overview", label: "Overview", icon: (isActive: boolean) => <span className={`text-xl drop-shadow-sm transition-all duration-300 ${isActive ? 'scale-110 grayscale-0' : 'grayscale-[50%] opacity-80'}`}>🏠</span> },
            { id: "expenses", label: "History", icon: (isActive: boolean) => <span className={`text-xl drop-shadow-sm transition-all duration-300 ${isActive ? 'scale-110 grayscale-0' : 'grayscale-[50%] opacity-80'}`}>📋</span> },
            { id: "goals", label: "Goals", icon: (isActive: boolean) => <span className={`text-xl drop-shadow-sm transition-all duration-300 ${isActive ? 'scale-110 grayscale-0' : 'grayscale-[50%] opacity-80'}`}>🎯</span> },
            { id: "sips", label: "Investments", icon: (isActive: boolean) => <span className={`text-xl drop-shadow-sm transition-all duration-300 ${isActive ? 'scale-110 grayscale-0' : 'grayscale-[50%] opacity-80'}`}>📈</span> },
            { id: "settings", label: "Settings", icon: (isActive: boolean) => <span className={`text-xl drop-shadow-sm transition-all duration-300 ${isActive ? 'scale-110 grayscale-0' : 'grayscale-[50%] opacity-80'}`}>⚙️</span> },
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
                    className="absolute inset-0 m-auto w-12 h-12 bg-text-primary rounded-full -z-10 shadow-lg"
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
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-bg/80 backdrop-blur-sm animate-fade-in" onClick={() => setIsAddOpen(false)}></div>
          <div className="relative w-full md:w-[480px] bg-card border border-border md:rounded-3xl rounded-t-3xl p-8 pb-32 md:pb-8 shadow-2xl animate-slide-up max-h-[85dvh] overflow-y-auto">
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
      {/* Recharge Modal removed since it now exists in Settings */}
    </div>
  );
}
