"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface GoalsManagerProps {
  initialGoals: any[];
}

export default function GoalsManager({ initialGoals }: GoalsManagerProps) {
  const [goals, setGoals] = useState<any[]>(initialGoals);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newGoal, setNewGoal] = useState({ name: "", targetAmount: "", icon: "🎯", deadline: "" });
  
  const [fundGoalId, setFundGoalId] = useState<string | null>(null);
  const [fundAmount, setFundAmount] = useState("");

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.name || !newGoal.targetAmount) return;

    const res = await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newGoal.name,
        targetAmount: parseFloat(newGoal.targetAmount),
        icon: newGoal.icon,
        deadline: newGoal.deadline || null,
      })
    });

    if (res.ok) {
      const g = await res.json();
      setGoals([...goals, g]);
      setIsAddOpen(false);
      setNewGoal({ name: "", targetAmount: "", icon: "🎯", deadline: "" });
      toast.success("Goal added!");
    } else {
      toast.error("Failed to add goal.");
    }
  };

  const handleAddFunds = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fundGoalId || !fundAmount) return;
    
    const goal = goals.find(g => g.id === fundGoalId);
    if (!goal) return;

    const newAmount = parseFloat(goal.currentAmount) + parseFloat(fundAmount);
    
    const res = await fetch(`/api/goals/${goal.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentAmount: newAmount }),
    });

    if (res.ok) {
      const updated = await res.json();
      setGoals(goals.map(g => g.id === updated.id ? updated : g));
      setFundGoalId(null);
      setFundAmount("");
      toast.success("Funds added!");
    } else {
      toast.error("Failed to add funds.");
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/goals/${id}`, { method: "DELETE" });
    if (res.ok) {
      setGoals(goals.filter(g => g.id !== id));
      toast.success("Goal deleted!");
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         {goals.map(goal => {
            const current = parseFloat(goal.currentAmount);
            const target = parseFloat(goal.targetAmount);
            const progress = Math.min((current / target) * 100, 100);
            
            return (
              <div key={goal.id} className="bg-card border border-border p-6 rounded-3xl shadow-sm relative overflow-hidden group">
                 <button onClick={() => handleDelete(goal.id)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-border text-text-muted opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-lg leading-none">
                   ✕
                 </button>
                 <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-full bg-bg shadow-inner flex items-center justify-center text-2xl">
                      {goal.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{goal.name}</h3>
                      <p className="text-[10px] uppercase tracking-widest text-text-muted font-bold">Target: {formatCurrency(target.toString())}</p>
                    </div>
                 </div>
                 
                 <div className="space-y-2 mb-6">
                    <div className="flex justify-between items-end">
                       <span className="text-2xl font-black tracking-tighter text-text-primary">{formatCurrency(current.toString())}</span>
                       <span className="text-sm font-bold text-text-muted">{progress.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 w-full bg-bg rounded-full overflow-hidden">
                       <motion.div 
                         initial={{ width: 0 }} 
                         animate={{ width: `${progress}%` }} 
                         transition={{ duration: 1, ease: "easeOut" }}
                         className={`h-full rounded-full ${progress >= 100 ? "bg-green-500" : "bg-text-primary"}`}
                       />
                    </div>
                 </div>
                 
                 {fundGoalId === goal.id ? (
                    <form onSubmit={handleAddFunds} className="flex items-center gap-2 animate-fade-in">
                       <span className="font-bold">₹</span>
                       <input 
                         type="number" 
                         value={fundAmount} 
                         onChange={e => setFundAmount(e.target.value)} 
                         placeholder="Amount" 
                         className="flex-1 bg-transparent border-b border-border py-1 focus:border-primary text-sm focus:outline-none"
                         autoFocus
                       />
                       <button type="submit" className="bg-text-primary text-bg px-3 py-1 rounded-full text-xs font-bold uppercase">Add</button>
                       <button type="button" onClick={() => { setFundGoalId(null); setFundAmount(""); }} className="text-text-muted px-2 py-1 text-xs uppercase font-bold">Cancel</button>
                    </form>
                 ) : (
                    <button 
                      onClick={() => setFundGoalId(goal.id)}
                      disabled={progress >= 100}
                      className={`w-full py-3 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${progress >= 100 ? "bg-green-500/10 text-green-500" : "bg-bg text-text-primary hover:bg-border"}`}
                    >
                      {progress >= 100 ? "Goal Reached! 🎉" : "+ Add Funds"}
                    </button>
                 )}
              </div>
            );
         })}
         
         {/* Add New Goal Card */}
         <div className="col-span-1 md:col-span-1 text-center py-12 border border-dashed border-border rounded-3xl bg-card hover:bg-bg transition-colors flex flex-col items-center justify-center min-h-[250px] cursor-pointer" onClick={() => setIsAddOpen(true)}>
             <div className="w-12 h-12 rounded-full bg-bg flex items-center justify-center text-text-primary mb-4 shadow-sm font-bold text-xl">+</div>
             <h3 className="font-bold text-lg mb-1">Create Savings Goal</h3>
             <p className="text-xs text-text-muted tracking-wide max-w-[200px]">Save up for a new laptop, vacation, or emergency fund.</p>
         </div>
      </div>

      <AnimatePresence>
         {isAddOpen && (
            <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center">
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-bg/80 backdrop-blur-sm" onClick={() => setIsAddOpen(false)} />
               <motion.div initial={{ scale: 0.95, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 50 }} className="relative bg-card border border-border p-8 pb-16 md:pb-8 rounded-t-3xl md:rounded-3xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
                 <button onClick={() => setIsAddOpen(false)} className="absolute top-6 right-6 w-8 h-8 rounded-full bg-border flex items-center justify-center text-text-muted hover:text-text-primary">✕</button>
                 <h2 className="text-xl font-bold tracking-tighter mb-6">New Goal</h2>
                 <form onSubmit={handleAddGoal} className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">Goal Name</label>
                      <input type="text" required value={newGoal.name} onChange={e => setNewGoal({...newGoal, name: e.target.value})} placeholder="e.g. New MacBook" className="w-full bg-transparent border-b border-border py-2 focus:border-primary focus:outline-none placeholder:text-text-muted/50" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">Target Amount (₹)</label>
                      <input type="number" required value={newGoal.targetAmount} onChange={e => setNewGoal({...newGoal, targetAmount: e.target.value})} placeholder="0.00" className="w-full bg-transparent border-b border-border py-2 focus:border-primary focus:outline-none placeholder:text-text-muted/50" />
                    </div>
                    <div className="flex gap-4">
                      <div className="w-24">
                        <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">Icon</label>
                        <input type="text" value={newGoal.icon} onChange={e => setNewGoal({...newGoal, icon: e.target.value})} className="w-full bg-transparent border-b border-border py-2 focus:border-primary focus:outline-none text-center" />
                      </div>
                      <div className="flex-1">
                        <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">Deadline</label>
                        <input type="date" value={newGoal.deadline} onChange={e => setNewGoal({...newGoal, deadline: e.target.value})} className="w-full bg-transparent border-b border-border py-2 focus:border-primary focus:outline-none text-text-muted appearance-none" style={{ colorScheme: "dark" }} />
                      </div>
                    </div>
                    <button type="submit" className="w-full bg-text-primary text-bg font-bold uppercase tracking-widest text-xs py-4 rounded-full mt-4 hover:opacity-90 transition-opacity">Let's Go</button>
                 </form>
               </motion.div>
            </div>
         )}
      </AnimatePresence>
    </div>
  );
}
