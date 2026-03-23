"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import BudgetCard from "@/components/BudgetCard";
import NotificationBanner from "@/components/NotificationBanner";
import DonutChart from "@/components/DonutChart";
import DailyBarChart from "@/components/BarChart";
import RecentExpenses from "@/components/RecentExpenses";
import ExpenseTable from "@/components/ExpenseTable";
import SettingsForm from "@/components/SettingsForm";
import AddExpenseForm from "@/components/AddExpenseForm";
import { Expense } from "@/lib/schema";

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
}: DashboardClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "expenses" | "settings">("overview");
  const [isAddOpen, setIsAddOpen] = useState(false);

  const staticPrimaryColor = "bg-text-primary text-bg shadow-lg shadow-black/10 border-none font-bold transition-all active:scale-95";
  const beautifulGradient = "bg-text-primary text-bg shadow-lg shadow-black/10 border-none";

  return (
    <div className="min-h-screen bg-bg text-text-primary flex flex-col md:pb-0 font-sans selection:bg-purple-500 selection:text-white">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-bg/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tighter">Trackr.</h1>
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
        {(["overview", "expenses", "settings"] as const).map((tab) => (
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
      <nav className="fixed bottom-8 left-6 right-6 z-50 md:hidden">
        <div className="bg-text-primary/10 backdrop-blur-2xl border border-white/10 rounded-full p-1 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center justify-between">
          {([{id: "overview", label: "Overview", icon: "🏠"}, {id: "expenses", label: "History", icon: "📋"}, {id: "settings", label: "Settings", icon: "⚙️"}] as const).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center justify-center flex-1 py-3 px-2 rounded-full transition-all duration-500 relative group ${
                activeTab === tab.id ? "bg-text-primary text-bg shadow-xl" : "text-text-muted hover:text-text-primary"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`text-lg transition-transform duration-500 ${activeTab === tab.id ? "scale-110" : "group-hover:scale-110"}`}>{tab.icon}</span>
                {activeTab === tab.id && (
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] animate-in fade-in slide-in-from-left-2 duration-300">{tab.label}</span>
                )}
              </div>
            </button>
          ))}
        </div>
      </nav>

      {/* Mobile FAB */}
      <button
        onClick={() => setIsAddOpen(true)}
        className={`md:hidden fixed bottom-24 right-6 w-14 h-14 rounded-full flex items-center justify-center text-3xl font-light z-40 active:scale-90 transition-transform ${staticPrimaryColor}`}
      >
        +
      </button>

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
