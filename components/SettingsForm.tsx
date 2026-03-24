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
  initialRecharge: any;
}

export default function SettingsForm({ initialBudget, initialCash, initialOnline, initialCategoryBudgets, categories, initialRecharge }: SettingsFormProps) {
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
  const [newCatName, setNewCatName] = useState("");
  const [newCatIcon, setNewCatIcon] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState("");
  const [editCatIcon, setEditCatIcon] = useState("");

  const [rechargeName, setRechargeName] = useState(initialRecharge?.name || "");
  const [rechargeAmount, setRechargeAmount] = useState(initialRecharge?.amount || "");
  const [rechargeEndDate, setRechargeEndDate] = useState(initialRecharge?.endDate || "");

  const [isPushEnabled, setIsPushEnabled] = useState(false);

  useEffect(() => {
    const prefs = JSON.parse(localStorage.getItem("trackr-notif-prefs") ?? "{}");
    setNotifyBudget(prefs.notifyBudget !== false);
    setNotifyCategory(prefs.notifyCategory !== false);
    
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.getRegistration().then(reg => {
        if (reg) {
          reg.pushManager.getSubscription().then(sub => {
            setIsPushEnabled(!!sub);
          });
        }
      });
    }
  }, []);

  const saveNotifPrefs = (key: string, value: boolean) => {
    const prefs = JSON.parse(localStorage.getItem("trackr-notif-prefs") ?? "{}");
    prefs[key] = value;
    localStorage.setItem("trackr-notif-prefs", JSON.stringify(prefs));
  };

  const saveBudget = () => {
    const budget = parseFloat(monthlyBudget);
    if (isNaN(budget) || budget < 0) {
      toast.error("Enter a valid budget amount");
      return;
    }
    toast.success("Budget saved");
    fetch("/api/budget", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ monthlyBudget: budget }),
    }).then(() => router.refresh());
  };

  const saveBalances = () => {
    const cash = parseFloat(cashBalance);
    const online = parseFloat(onlineBalance);
    if (isNaN(cash) || isNaN(online)) {
      toast.error("Enter valid numeric amounts for balances");
      return;
    }
    toast.success("Balances saved");
    fetch("/api/balances", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initialCashBalance: cash, initialOnlineBalance: online }),
    }).then(() => router.refresh());
  };

  const saveCategoryLimits = () => {
    const month = getMonthString();
    toast.success("Category limits saved");
    const saves = Object.entries(categoryLimits)
      .filter(([, v]) => v !== "")
      .map(([category, limitAmount]) =>
        fetch("/api/category-budget", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ category, limitAmount: parseFloat(limitAmount), month }),
        })
      );
    Promise.all(saves).then(() => router.refresh());
  };

  const addCategory = () => {
    if (!newCatName || !newCatIcon) {
      toast.error("Enter both name and icon");
      return;
    }
    toast.success("Category added");
    fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCatName.toLowerCase(), icon: newCatIcon }),
    }).then(() => {
      setNewCatName("");
      setNewCatIcon("");
      router.refresh();
    });
  };

  const deleteCategory = (id: string) => {
    if (!confirm("Are you sure? Old transactions in this category will keep their name but lose their specific icon.")) return;
    toast.success("Category deleted");
    fetch(`/api/categories/${id}`, { method: "DELETE" }).then(() => router.refresh());
  };

  const updateCategory = (id: string) => {
    toast.success("Category updated");
    fetch(`/api/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editCatName.toLowerCase(), icon: editCatIcon }),
    }).then(() => {
      setEditingId(null);
      router.refresh();
    });
  };

  const saveRecharge = () => {
    if (!rechargeName || !rechargeAmount || !rechargeEndDate) {
      toast.error("Enter plan name, amount, and due date");
      return;
    }
    toast.success("Active Plan saved");
    fetch("/api/recharges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: rechargeName, amount: rechargeAmount, endDate: rechargeEndDate }),
    }).then(() => router.refresh());
  };

  const togglePush = async () => {
    try {
      if (!('serviceWorker' in navigator)) {
        toast.error("Service Workers not supported in this browser");
        return;
      }
      let registration = await navigator.serviceWorker.getRegistration();
      
      if (!registration) {
        try {
          registration = await navigator.serviceWorker.register('/sw.js');
        } catch (err) {
          toast.error("Service Worker registration failed. Please ensure you are not in development mode with PWA disabled, or run a build.");
          console.error("SW Registration Error:", err);
          return;
        }
      }
      
      await navigator.serviceWorker.ready;
      registration = await navigator.serviceWorker.getRegistration();
      
      if (!registration) {
        toast.error("Service worker not available.");
        return;
      }
      
      if (isPushEnabled) {
        const sub = await registration.pushManager.getSubscription();
        if (sub) {
          await fetch('/api/push/subscribe', {
            method: 'DELETE',
            body: JSON.stringify({ endpoint: sub.endpoint }),
            headers: { 'Content-Type': 'application/json' }
          });
          await sub.unsubscribe();
        }
        setIsPushEnabled(false);
        toast.success("Web Push disabled");
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast.error("Permission denied");
        return;
      }
      
      const applicationServerKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!applicationServerKey) {
        toast.error("VAPID Public Key missing from environment");
        return;
      }

      const padding = '='.repeat((4 - applicationServerKey.length % 4) % 4);
      const base64 = (applicationServerKey + padding).replace(/\-/g, '+').replace(/_/g, '/');
      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);
      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: outputArray
      });

      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        body: JSON.stringify(subscription),
        headers: { 'Content-Type': 'application/json' }
      });

      if (res.ok) {
        setIsPushEnabled(true);
        toast.success("Web Push fully enabled!");
      } else {
        toast.error("Failed to save push subscription");
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Web Push not supported or blocked");
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
          <button onClick={saveBudget} className={`${btnClass} w-full sm:w-auto`}>
            Save
          </button>
        </div>
      </div>

      {/* Active Mobile/Internet Plan */}
      <div className={sectionClass}>
        <h2 className="font-bold text-text-primary text-lg tracking-tighter mb-6">Active Pre-Paid Plan</h2>
        <div className="flex flex-col sm:flex-row items-center gap-6 mb-4">
          <div className="relative w-full sm:flex-1 sm:max-w-xs focus-within:text-primary transition-colors">
            <span className="absolute left-0 bottom-3 text-text-muted pointer-events-none text-xs font-bold uppercase tracking-widest">Plan Name</span>
            <input
              type="text"
              value={rechargeName}
              onChange={(e) => setRechargeName(e.target.value)}
              className={`${inputClass} pl-24 w-full`}
              placeholder="e.g. Jio 5G"
            />
          </div>
          <div className="relative w-full sm:flex-1 sm:max-w-xs focus-within:text-primary transition-colors">
            <span className="absolute left-0 bottom-3 text-text-muted pointer-events-none text-xs font-bold uppercase tracking-widest">Amount</span>
            <input
              type="number"
              value={rechargeAmount}
              onChange={(e) => setRechargeAmount(e.target.value)}
              className={`${inputClass} pl-20 w-full`}
              placeholder="299"
            />
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-end gap-6 relative z-10">
          <div className="relative w-full sm:max-w-xs focus-within:text-primary transition-colors">
            <span className="absolute left-0 bottom-3 text-text-muted pointer-events-none text-xs font-bold uppercase tracking-widest bg-bg px-1 z-10">Due Date</span>
            <input
              type="date"
              value={rechargeEndDate}
              onChange={(e) => setRechargeEndDate(e.target.value)}
              className={`${inputClass} pl-20 w-full text-sm block`}
              style={{ colorScheme: "dark" }}
            />
          </div>
          <button onClick={saveRecharge} className={`${btnClass} w-full sm:w-auto h-full self-end`}>
            Save Plan
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
          <button onClick={saveBalances} className={`${btnClass} w-full sm:w-auto h-full self-end`}>
            Save
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
          className={`${btnClass} mt-10 w-full sm:w-auto`}
        >
          Save Allocations
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
          <button onClick={addCategory} className={`${btnClass}`}>
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
                  if (!value && "Notification" in window && Notification.permission !== "granted") {
                    Notification.requestPermission();
                  }
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
        
        <div className="mt-8 pt-6 border-t border-border flex justify-between items-center">
          <div>
            <h3 className="font-bold text-sm tracking-widest uppercase text-text-primary">Background Web Push</h3>
            <p className="text-[10px] text-text-muted mt-1 uppercase tracking-widest">Receive 12 AI memes daily & budget alerts even closed.</p>
          </div>
          <button
            type="button"
            onClick={togglePush}
            className={`text-[10px] font-bold uppercase tracking-widest px-4 py-2 hover:opacity-90 transition-opacity rounded-full ml-4 whitespace-nowrap ${
              isPushEnabled ? 'bg-border text-text-primary' : 'bg-primary text-bg'
            }`}
          >
            {isPushEnabled ? "Disable Push" : "Enable Push"}
          </button>
        </div>
      </div>
    </div>
  );
}
