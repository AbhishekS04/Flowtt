"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getMonthString } from "@/lib/utils";

interface SettingsData {
  monthlyBudget: string;
  categoryLimits: Record<string, string>;
}

interface SettingsFormProps {
  initialBudget: number;
  initialCash: number;
  initialOnline: number;
  initialCategoryBudgets: Array<{ category: string; limitAmount: string }>;
  categories: { id: string; name: string; icon: string }[];
}

export default function SettingsForm({ initialBudget, initialCash, initialOnline, initialCategoryBudgets, categories }: SettingsFormProps) {
  const router = useRouter();
  const [monthlyBudget, setMonthlyBudget] = useState(String(initialBudget));
  const [cashBalance, setCashBalance] = useState(String(initialCash));
  const [onlineBalance, setOnlineBalance] = useState(String(initialOnline));
  const [categoryLimits, setCategoryLimits] = useState<Record<string, string>>(() => {
    const limits: Record<string, string> = {};
    for (const cb of initialCategoryBudgets) {
      limits[cb.category] = cb.limitAmount;
    }
    return limits;
  });
  const [notifyBudget, setNotifyBudget] = useState(true);
  const [notifyCategory, setNotifyCategory] = useState(true);
  const [savingBudget, setSavingBudget] = useState(false);
  const [savingBalances, setSavingBalances] = useState(false);
  const [savingCategory, setSavingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatIcon, setNewCatIcon] = useState("");
  const [addingCat, setAddingCat] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState("");
  const [editCatIcon, setEditCatIcon] = useState("");

  useEffect(() => {
    const prefs = JSON.parse(localStorage.getItem("trackr-notif-prefs") ?? "{}");
    setNotifyBudget(prefs.notifyBudget !== false);
    setNotifyCategory(prefs.notifyCategory !== false);
  }, []);

  const saveNotifPrefs = (key: string, value: boolean) => {
    const prefs = JSON.parse(localStorage.getItem("trackr-notif-prefs") ?? "{}");
    prefs[key] = value;
    localStorage.setItem("trackr-notif-prefs", JSON.stringify(prefs));
  };

  const saveBudget = async () => {
    const budget = parseFloat(monthlyBudget);
    if (isNaN(budget) || budget < 0) {
      toast.error("Enter a valid budget amount");
      return;
    }
    setSavingBudget(true);
    const res = await fetch("/api/budget", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ monthlyBudget: budget }),
    });
    setSavingBudget(false);
    if (res.ok) {
      toast.success("Budget saved");
      router.refresh();
    } else {
      toast.error("Failed to save budget");
    }
  };

  const saveBalances = async () => {
    const cash = parseFloat(cashBalance);
    const online = parseFloat(onlineBalance);
    if (isNaN(cash) || isNaN(online)) {
      toast.error("Enter valid numeric amounts for balances");
      return;
    }
    setSavingBalances(true);
    const res = await fetch("/api/balances", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initialCashBalance: cash, initialOnlineBalance: online }),
    });
    setSavingBalances(false);
    if (res.ok) {
      toast.success("Balances saved");
      router.refresh();
    } else {
      toast.error("Failed to save balances");
    }
  };

  const saveCategoryLimits = async () => {
    setSavingCategory(true);
    const month = getMonthString();
    const saves = Object.entries(categoryLimits)
      .filter(([, v]) => v !== "")
      .map(([category, limitAmount]) =>
        fetch("/api/category-budget", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ category, limitAmount: parseFloat(limitAmount), month }),
        })
      );
    await Promise.all(saves);
    setSavingCategory(false);
    toast.success("Category limits saved");
    router.refresh();
  };

  const addCategory = async () => {
    if (!newCatName || !newCatIcon) {
      toast.error("Enter both name and icon");
      return;
    }
    setAddingCat(true);
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCatName.toLowerCase(), icon: newCatIcon }),
    });
    setAddingCat(false);
    if (res.ok) {
      toast.success("Category added");
      setNewCatName("");
      setNewCatIcon("");
      setTimeout(() => router.refresh(), 500);
    } else {
      toast.error("Failed to add category");
    }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm("Are you sure? Old transactions in this category will keep their name but lose their specific icon.")) return;
    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Category deleted");
      setTimeout(() => router.refresh(), 500);
    } else {
      toast.error("Failed to delete category");
    }
  };

  const updateCategory = async (id: string) => {
    const res = await fetch(`/api/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editCatName.toLowerCase(), icon: editCatIcon }),
    });
    if (res.ok) {
      toast.success("Category updated");
      setEditingId(null);
      setTimeout(() => router.refresh(), 500);
    } else {
      toast.error("Failed to update category");
    }
  };

  const sectionClass = "border-t border-border py-8 group relative overflow-hidden";
  const inputClass =
    "bg-transparent border-b border-border text-text-primary px-0 py-2.5 text-lg focus:outline-none focus:border-primary transition-colors placeholder:text-text-muted/30 appearance-none rounded-none";
  const btnClass =
    "bg-text-primary text-bg font-bold py-2.5 px-6 text-[10px] uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed border-none shadow-lg shadow-black/5";

  return (
    <div className="animate-fade-in pb-10">
      {/* Monthly Budget */}
      <div className={sectionClass}>
        <h2 className="font-bold text-text-primary text-lg tracking-tighter mb-6">Master Budget</h2>
        <div className="flex flex-col sm:flex-row items-end gap-6">
          <div className="relative w-full sm:flex-1 sm:max-w-xs focus-within:text-primary transition-colors">
            <span className="absolute left-0 bottom-3 text-text-muted pointer-events-none text-lg">₹</span>
            <input
              type="number"
              min="0"
              step="100"
              value={monthlyBudget}
              onChange={(e) => setMonthlyBudget(e.target.value)}
              className={`${inputClass} pl-6 w-full font-bold`}
              placeholder="0.00"
            />
          </div>
          <button onClick={saveBudget} disabled={savingBudget} className={`${btnClass} w-full sm:w-auto`}>
            {savingBudget ? "Saving" : "Save"}
          </button>
        </div>
      </div>

      {/* Account Balances */}
      <div className={sectionClass}>
        <h2 className="font-bold text-text-primary text-lg tracking-tighter mb-6">Account Balances</h2>
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative w-full sm:flex-1 sm:max-w-xs focus-within:text-primary transition-colors">
            <span className="absolute left-0 bottom-3 text-text-muted pointer-events-none text-xs font-bold uppercase tracking-widest">Cash</span>
            <input
              type="number"
              value={cashBalance}
              onChange={(e) => setCashBalance(e.target.value)}
              className={`${inputClass} pl-16 w-full font-bold`}
              placeholder="0.00"
            />
          </div>
          <div className="relative w-full sm:flex-1 sm:max-w-xs focus-within:text-primary transition-colors">
            <span className="absolute left-0 bottom-3 text-text-muted pointer-events-none text-xs font-bold uppercase tracking-widest">Online</span>
            <input
              type="number"
              value={onlineBalance}
              onChange={(e) => setOnlineBalance(e.target.value)}
              className={`${inputClass} pl-20 w-full font-bold`}
              placeholder="0.00"
            />
          </div>
          <button onClick={saveBalances} disabled={savingBalances} className={`${btnClass} w-full sm:w-auto h-full self-end`}>
            {savingBalances ? "Saving" : "Save"}
          </button>
        </div>
      </div>

      {/* Category Limits */}
      <div className={sectionClass}>
        <h2 className="font-bold text-text-primary text-lg tracking-tighter mb-2">Category Allocations</h2>
        <p className="text-[10px] uppercase font-bold tracking-widest text-text-muted mb-8">
          Limits for {getMonthString()}
        </p>
        <div className="space-y-6">
          {categories.map((cat) => (
            <div key={cat.id} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 group/cat focus-within:text-primary">
              <span className="sm:w-32 text-[10px] font-bold tracking-widest uppercase transition-colors">{cat.icon} {cat.name}</span>
              <div className="relative flex-1 max-w-sm">
                <span className="absolute left-0 bottom-3 text-text-muted pointer-events-none text-lg">₹</span>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={categoryLimits[cat.name] || ""}
                  onChange={(e) =>
                    setCategoryLimits((p) => ({ ...p, [cat.name]: e.target.value }))
                  }
                  className={`${inputClass} pl-6 w-full`}
                  placeholder="Uncapped"
                />
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={saveCategoryLimits}
          disabled={savingCategory}
          className={`${btnClass} mt-10 w-full sm:w-auto`}
        >
          {savingCategory ? "Saving" : "Save Allocations"}
        </button>
      </div>

      {/* Custom Categories */}
      <div className={sectionClass}>
        <h2 className="font-bold text-text-primary text-lg tracking-tighter mb-6">Manage Categories</h2>
        <div className="space-y-4 mb-8">
          {categories.map((cat) => (
            <div key={cat.id} className="flex flex-col gap-3 py-4 border-b border-border">
              {editingId === cat.id ? (
                <div className="flex gap-4 items-end">
                  <input 
                    type="text" 
                    value={editCatIcon}
                    onChange={e => setEditCatIcon(e.target.value)}
                    className={`${inputClass} w-16 text-center`}
                  />
                  <input 
                    type="text" 
                    value={editCatName}
                    onChange={e => setEditCatName(e.target.value)}
                    className={`${inputClass} flex-1`}
                  />
                  <div className="flex gap-2">
                    <button onClick={() => updateCategory(cat.id)} className={`${btnClass} px-4`}>Save</button>
                    <button onClick={() => setEditingId(null)} className="text-[10px] uppercase font-bold text-text-muted tracking-widest border border-border px-4 py-2.5">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-xl">{cat.icon}</span>
                    <span className="text-xs font-bold tracking-widest uppercase text-text-primary">{cat.name}</span>
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => {
                        setEditingId(cat.id);
                        setEditCatName(cat.name);
                        setEditCatIcon(cat.icon);
                      }}
                      className="text-[10px] font-bold tracking-widest uppercase text-text-muted hover:text-text-primary transition-colors border border-border px-3 py-1.5"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => deleteCategory(cat.id)}
                      className="text-[10px] font-bold tracking-widest uppercase text-red-400 hover:text-red-300 transition-colors border border-border px-3 py-1.5"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {categories.length === 0 && <p className="text-xs text-text-muted font-bold uppercase tracking-widest">No categories yet. They will be seeded on your next visit.</p>}
        </div>
        
        <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-4">Add New Category</p>
        <div className="flex gap-4">
          <input 
            type="text" 
            placeholder="🍕"
            value={newCatIcon}
            onChange={e => setNewCatIcon(e.target.value)}
            className={`${inputClass} w-20 text-center text-xl`}
          />
          <input 
            type="text" 
            placeholder="Category Name"
            value={newCatName}
            onChange={e => setNewCatName(e.target.value)}
            className={`${inputClass} flex-1`}
          />
          <button onClick={addCategory} disabled={addingCat} className={`${btnClass}`}>
            Create
          </button>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className={sectionClass}>
        <h2 className="font-bold text-text-primary text-lg tracking-tighter mb-8">Alerts</h2>
        <div className="space-y-6">
          {[
            {
              key: "notifyBudget",
              label: "80% Global Utilization Alert",
              value: notifyBudget,
              set: setNotifyBudget,
            },
            {
              key: "notifyCategory",
              label: "Category Breach Alert",
              value: notifyCategory,
              set: setNotifyCategory,
            },
          ].map(({ key, label, value, set }) => (
            <label key={key} className="flex items-center justify-between cursor-pointer group/toggle select-none">
              <span className="text-[11px] font-bold tracking-widest uppercase">{label}</span>
              <button
                type="button"
                onClick={() => {
                  set(!value);
                  saveNotifPrefs(key, !value);
                }}
                className={`relative w-10 h-5 border transition-all duration-300 ease-in-out ${
                  value ? "bg-primary border-primary" : "bg-transparent border-border"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-3.5 h-3.5 transition-transform duration-300 ease-in-out ${
                    value ? "translate-x-5 bg-bg" : "translate-x-0 bg-text-muted"
                  }`}
                />
              </button>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
