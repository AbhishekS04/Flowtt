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
    <div className="min-h-screen bg-bg text-text-primary flex flex-col pb-[85px] md:pb-0 font-sans selection:bg-purple-500 selection:text-white">
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
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 animate-fade-in relative">
        {activeTab === "overview" && (
          <div className="space-y-8 animate-fade-in">
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

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-xl border-t border-border md:hidden shadow-[0_-10px_40px_rgba(0,0,0,0.8)]" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="flex items-center justify-around h-[65px] px-2">
          {([{id: "overview", label: "Home", icon: "🏠"}, {id: "expenses", label: "Expenses", icon: "📋"}, {id: "settings", label: "Settings", icon: "⚙️"}] as const).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex flex-col items-center justify-center flex-1 h-full gap-1 text-[9px] font-bold uppercase tracking-widest transition-all duration-300 ${
                activeTab === tab.id ? "text-purple-400" : "text-text-muted"
              }`}
            >
              <span className={`text-xl leading-none transition-transform duration-300 ${activeTab === tab.id ? "scale-110" : ""}`}>{tab.icon}</span>
              {tab.label}
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
