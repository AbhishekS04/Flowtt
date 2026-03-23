"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Expense } from "@/lib/schema";
import { formatCurrency, getCategoryIcon } from "@/lib/utils";
import { getMonthString } from "@/lib/utils";

interface ExpenseTableProps {
  initialExpenses: any[];
  categories: { id: string; name: string; icon: string }[];
}

const ITEMS_PER_PAGE = 10;

export default function ExpenseTable({ initialExpenses, categories }: ExpenseTableProps) {
  const [expenses, setExpenses] = useState<any[]>(initialExpenses);
  
  const getIcon = (catName: string) => {
    const custom = categories.find((c) => c.name.toLowerCase() === catName.toLowerCase());
    return custom ? custom.icon : getCategoryIcon(catName);
  };
  const [selectedMonth, setSelectedMonth] = useState(getMonthString());
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isMonthOpen, setIsMonthOpen] = useState(false);
  const [isCatOpen, setIsCatOpen] = useState(false);
  const [isEditCatOpen, setIsEditCatOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ amount: "", category: "", date: "", note: "", type: "expense" });
  const [loading, setLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchExpenses = async (month: string, category: string) => {
    setLoading(true);
    const params = new URLSearchParams({ month });
    if (category) params.set("category", category);
    const res = await fetch(`/api/transactions?${params}`);
    const data = await res.json();
    setExpenses(data);
    setCurrentPage(1);
    setLoading(false);
  };

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
    fetchExpenses(month, selectedCategory);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    fetchExpenses(selectedMonth, category);
  };

  const startEdit = (expense: any) => {
    setEditingId(expense.id);
    setEditData({
      amount: expense.amount,
      category: expense.category,
      date: expense.date,
      note: expense.note ?? "",
      type: expense.type,
    });
  };

  const saveEdit = async (id: string) => {
    const isIncome = editData.type === "income";
    const endpoint = isIncome ? `/api/incomes/${id}` : `/api/expenses/${id}`;
    const payload = isIncome ? {
      amount: parseFloat(editData.amount),
      source: editData.category,
      date: editData.date,
      note: editData.note,
    } : {
      amount: parseFloat(editData.amount),
      category: editData.category,
      date: editData.date,
      note: editData.note,
    };
    const res = await fetch(endpoint, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      toast.success("Updated");
      setEditingId(null);
      fetchExpenses(selectedMonth, selectedCategory);
    } else {
      toast.error("Failed to update");
    }
  };

  const confirmDelete = async (id: string) => {
    const item = expenses.find((e: any) => e.id === id);
    if (!item) return;
    const endpoint = item.type === "income" ? `/api/incomes/${id}` : `/api/expenses/${id}`;
    const res = await fetch(endpoint, { method: "DELETE" });
    if (res.ok) {
      toast.success("Deleted");
      setDeleteId(null);
      setExpenses((prev) => prev.filter((e) => e.id !== id));
    } else {
      toast.error("Failed to delete");
    }
  };

  const downloadCSV = () => {
    if (expenses.length === 0) {
      toast.error("No data to export");
      return;
    }
    const headers = ["Date", "Category", "Amount", "Note"];
    const rows = expenses.map(e => [
      e.date,
      e.category,
      e.amount,
      `"${(e.note || "").replace(/"/g, '""')}"`
    ]);
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `expenses_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalPages = Math.ceil(expenses.length / ITEMS_PER_PAGE);
  const paginated = expenses.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const months: string[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(getMonthString(d));
  }

  const selectClass = "bg-transparent border-b border-border text-text-primary px-0 py-2 text-sm focus:outline-none focus:border-primary transition-colors appearance-none cursor-pointer uppercase tracking-widest font-bold w-full md:w-auto min-w-[140px]";

  return (
    <div className="space-y-8">
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
        <div className="flex flex-col md:flex-row gap-6 w-full md:w-auto z-50">
          {/* Month Filter */}
          <div className="relative min-w-[140px]">
            <button
              onClick={() => setIsMonthOpen(!isMonthOpen)}
              className={`${selectClass} flex items-center justify-between group/drop`}
            >
              <span>{selectedMonth}</span>
              <svg className={`w-3 h-3 transition-transform duration-300 ${isMonthOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {isMonthOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsMonthOpen(false)} />
                <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-card border border-border shadow-2xl rounded-xl overflow-hidden animate-slide-up-subtle">
                  <div className="max-h-60 overflow-y-auto py-1 custom-scrollbar">
                    {months.map((m) => (
                      <button
                        key={m}
                        onClick={() => {
                          handleMonthChange(m);
                          setIsMonthOpen(false);
                        }}
                        className={`w-full px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest transition-colors ${
                          selectedMonth === m ? "bg-text-primary text-bg" : "hover:bg-text-primary/5 text-text-primary"
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Category Filter */}
          <div className="relative min-w-[140px]">
            <button
              onClick={() => setIsCatOpen(!isCatOpen)}
              className={`${selectClass} flex items-center justify-between group/drop`}
            >
              <span className="truncate">{selectedCategory || "ALL CATEGORIES"}</span>
              <svg className={`w-3 h-3 transition-transform duration-300 ${isCatOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {isCatOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsCatOpen(false)} />
                <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-card border border-border shadow-2xl rounded-xl overflow-hidden animate-slide-up-subtle">
                  <div className="max-h-60 overflow-y-auto py-1 custom-scrollbar">
                    <button
                      onClick={() => {
                        handleCategoryChange("");
                        setIsCatOpen(false);
                      }}
                      className={`w-full px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest transition-colors ${
                        selectedCategory === "" ? "bg-text-primary text-bg" : "hover:bg-text-primary/5 text-text-primary"
                      }`}
                    >
                      ALL CATEGORIES
                    </button>
                    {categories.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          handleCategoryChange(c.name);
                          setIsCatOpen(false);
                        }}
                        className={`w-full px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest transition-colors ${
                          selectedCategory === c.name ? "bg-text-primary text-bg" : "hover:bg-text-primary/5 text-text-primary"
                        }`}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        <button
          onClick={downloadCSV}
          className="text-[10px] font-bold uppercase tracking-widest border border-border px-6 py-2.5 hover:bg-white/5 transition-colors text-text-primary whitespace-nowrap self-stretch md:self-auto rounded-none"
        >
          Download CSV
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton h-16 w-full border-b border-border" />
          ))}
        </div>
      ) : expenses.length === 0 ? (
        <div className="text-center py-20 border-t border-b border-border">
          <p className="text-text-muted text-[10px] font-bold uppercase tracking-widest">No matching records</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block w-full">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-border text-text-muted font-bold text-[10px] uppercase tracking-widest">
                  <th className="text-left py-4 px-2 w-[15%]">Date</th>
                  <th className="text-left py-4 px-2 w-[25%]">Category</th>
                  <th className="text-left py-4 px-2 w-[35%]">Note</th>
                  <th className="text-right py-4 px-2 w-[15%]">Amount</th>
                  <th className="text-right py-4 px-2 w-[10%]"></th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((expense) => {
                  const isIncome = expense.type === "income";
                  return (
                  <tr key={expense.id} className="border-b border-border hover:bg-white/[0.02] transition-colors group">
                    {editingId === expense.id ? (
                      <>
                        <td className="py-3 px-2">
                          <input
                            type="date"
                            value={editData.date}
                            onChange={(e) => setEditData((p) => ({ ...p, date: e.target.value }))}
                            className="bg-transparent border-b border-border text-text-primary px-0 py-1 text-sm w-full focus:outline-none focus:border-primary uppercase tracking-widest font-bold text-[10px]"
                          />
                        </td>
                        <td className="py-3 px-2">
                          {editData.type === "income" ? (
                            <input
                              type="text"
                              value={editData.category}
                              onChange={(e) => setEditData((p) => ({ ...p, category: e.target.value }))}
                              className="bg-transparent border-b border-border text-text-primary px-0 py-1 text-[10px] w-full focus:outline-none focus:border-primary uppercase tracking-widest font-bold"
                            />
                          ) : (
                            <div className="relative">
                            <button
                              onClick={() => setIsEditCatOpen(!isEditCatOpen)}
                              className="bg-transparent border-b border-border text-text-primary px-0 py-1 text-[10px] focus:outline-none focus:border-primary uppercase tracking-widest font-bold w-full text-left flex items-center justify-between group/drop"
                            >
                              <span>{editData.category}</span>
                              <svg className={`w-2.5 h-2.5 transition-transform duration-300 ${isEditCatOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                            {isEditCatOpen && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={() => setIsEditCatOpen(false)} />
                                <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-card border border-border shadow-2xl rounded-lg overflow-hidden animate-slide-up-subtle">
                                  <div className="max-h-40 overflow-y-auto py-1 custom-scrollbar">
                                    {categories.map((c) => (
                                      <button
                                        key={c.id}
                                        onClick={() => {
                                          setEditData(p => ({ ...p, category: c.name }));
                                          setIsEditCatOpen(false);
                                        }}
                                        className={`w-full px-3 py-2 text-left text-[10px] font-bold uppercase tracking-widest transition-colors ${
                                          editData.category === c.name ? "bg-text-primary text-bg" : "hover:bg-text-primary/5 text-text-primary"
                                        }`}
                                      >
                                        {c.name}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                          )}
                        </td>
                        <td className="py-3 px-2">
                          <input
                            type="text"
                            value={editData.note}
                            onChange={(e) => setEditData((p) => ({ ...p, note: e.target.value }))}
                            className="bg-transparent border-b border-border text-text-primary px-0 py-1 text-sm w-full focus:outline-none focus:border-primary"
                          />
                        </td>
                        <td className="py-3 px-2">
                          <input
                            type="number"
                            value={editData.amount}
                            onChange={(e) => setEditData((p) => ({ ...p, amount: e.target.value }))}
                            className="bg-transparent border-b border-border text-text-primary px-0 py-1 text-sm w-24 text-right focus:outline-none focus:border-primary font-bold"
                          />
                        </td>
                        <td className="py-3 px-2 text-right space-x-4">
                          <button onClick={() => saveEdit(expense.id)} className="text-text-primary text-[10px] font-bold tracking-widest uppercase hover:underline">Sav</button>
                          <button onClick={() => setEditingId(null)} className="text-text-muted text-[10px] font-bold tracking-widest uppercase hover:text-text-primary">Can</button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-5 px-2 text-text-muted text-[10px] font-bold uppercase tracking-widest">{expense.date}</td>
                        <td className="py-5 px-2">
                          <span className="inline-flex items-center gap-3">
                            <span className="text-xl">{getIcon(expense.category)}</span>
                            <span className="uppercase text-text-primary text-[10px] font-bold tracking-widest">{expense.category}</span>
                          </span>
                        </td>
                        <td className="py-5 px-2 text-text-muted text-sm">{expense.note ?? "—"}</td>
                        <td className={`py-5 px-2 text-right font-bold text-base tracking-tighter ${isIncome ? "text-green-500" : "text-red-500"}`}>
                          {isIncome ? "+" : "-"}{formatCurrency(expense.amount)}
                        </td>
                        <td className="py-5 px-2 text-right space-x-4 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => startEdit(expense)}
                            className="text-text-primary text-[10px] font-bold uppercase tracking-widest hover:underline transition-colors"
                          >
                            Edt
                          </button>
                          <button
                            onClick={() => setDeleteId(expense.id)}
                            className="text-text-muted text-[10px] font-bold uppercase tracking-widest hover:text-text-primary transition-colors"
                          >
                            Del
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile List View */}
          <div className="md:hidden space-y-0">
            {paginated.map((expense, idx) => {
              const isIncome = expense.type === "income";
              return (
              <div key={expense.id} className={`py-5 flex flex-col gap-4 group ${idx !== paginated.length - 1 ? 'border-b border-border' : ''}`}>
                {editingId === expense.id ? (
                  <div className="space-y-4 w-full">
                    <div className="flex gap-4">
                      <input
                        type="date"
                        value={editData.date}
                        onChange={(e) => setEditData((p) => ({ ...p, date: e.target.value }))}
                        className="flex-1 bg-transparent border-b border-border text-text-primary px-0 py-2 text-sm focus:outline-none focus:border-primary uppercase tracking-widest font-bold text-[10px]"
                      />
                      <input
                        type="number"
                        value={editData.amount}
                        onChange={(e) => setEditData((p) => ({ ...p, amount: e.target.value }))}
                        className="w-1/3 bg-transparent border-b border-border text-text-primary px-0 py-2 text-sm text-right focus:outline-none focus:border-primary font-bold"
                      />
                    </div>
                    {editData.type === "income" ? (
                      <input
                        type="text"
                        value={editData.category}
                        onChange={(e) => setEditData((p) => ({ ...p, category: e.target.value }))}
                        className="w-full bg-transparent border-b border-border text-text-primary px-0 py-2 text-[10px] focus:outline-none focus:border-primary uppercase tracking-widest font-bold"
                      />
                    ) : (
                      <div className="relative">
                      <button
                        onClick={() => setIsEditCatOpen(!isEditCatOpen)}
                        className="w-full bg-transparent border-b border-border text-text-primary px-0 py-2 text-[10px] focus:outline-none focus:border-primary uppercase tracking-widest font-bold text-left flex items-center justify-between group/drop"
                      >
                        <span>{editData.category}</span>
                        <svg className={`w-3 h-3 transition-transform duration-300 ${isEditCatOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {isEditCatOpen && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setIsEditCatOpen(false)} />
                          <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-card border border-border shadow-2xl rounded-lg overflow-hidden animate-slide-up-subtle">
                            <div className="max-h-40 overflow-y-auto py-1 custom-scrollbar">
                              {categories.map((c) => (
                                <button
                                  key={c.id}
                                  onClick={() => {
                                    setEditData(p => ({ ...p, category: c.name }));
                                    setIsEditCatOpen(false);
                                  }}
                                  className={`w-full px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest transition-colors ${
                                    editData.category === c.name ? "bg-text-primary text-bg" : "hover:bg-text-primary/5 text-text-primary"
                                  }`}
                                >
                                  {c.name}
                                </button>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                    )}
                    <input
                      type="text"
                      value={editData.note}
                      onChange={(e) => setEditData((p) => ({ ...p, note: e.target.value }))}
                      className="w-full bg-transparent border-b border-border text-text-primary px-0 py-2 text-sm focus:outline-none focus:border-primary"
                      placeholder="Note"
                    />
                    <div className="flex gap-4 pt-2">
                      <button onClick={() => saveEdit(expense.id)} className="flex-1 border border-primary text-primary hover:bg-primary hover:text-bg transition-colors py-2 text-[10px] font-bold uppercase tracking-widest">Save</button>
                      <button onClick={() => setEditingId(null)} className="flex-1 border border-border text-text-primary py-2 text-[10px] font-bold uppercase tracking-widest">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 border border-border flex items-center justify-center text-lg">
                          {getIcon(expense.category)}
                        </div>
                        <div>
                          <p className="text-text-primary font-bold uppercase tracking-widest text-[11px] leading-tight mb-1">
                            {expense.category}
                          </p>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">{expense.date}</p>
                        </div>
                      </div>
                      <span className={`font-bold text-lg tracking-tighter ${isIncome ? "text-green-500" : "text-red-500"}`}>
                        {isIncome ? "+" : "-"}{formatCurrency(expense.amount)}
                      </span>
                    </div>
                    {expense.note && (
                      <p className="text-sm text-text-muted border-l-2 border-border pl-3 ml-5 py-1">
                        {expense.note}
                      </p>
                    )}
                    <div className="flex gap-4 pt-4 mt-2 border-t border-border/30">
                      <button onClick={() => startEdit(expense)} className="text-text-primary text-[10px] font-bold tracking-widest uppercase flex-1 text-center py-2 border border-border hover:bg-white/5 transition-colors">
                        Edit
                      </button>
                      <button onClick={() => setDeleteId(expense.id)} className="text-text-muted hover:text-text-primary text-[10px] font-bold tracking-widest uppercase flex-1 text-center py-2 border border-border transition-colors">
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-8 border-t border-border">
              <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
                Pg <span className="text-text-primary">{currentPage}</span> / {totalPages}
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-border text-[10px] uppercase tracking-widest font-bold text-text-primary disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/5 transition-all"
                >
                  Prev
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-border text-[10px] uppercase tracking-widest font-bold text-text-primary disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/5 transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Delete confirm dialog */}
      {deleteId && (
        <div className="fixed inset-0 bg-bg/90 backdrop-blur-sm flex items-center justify-center z-[100] animate-fade-in px-4">
          <div className="bg-card border border-border p-8 max-w-sm w-full animate-slide-up">
            <h3 className="text-text-primary font-bold text-xl mb-4 tracking-tighter uppercase">
              Delete?
            </h3>
            <p className="text-text-muted text-sm mb-8 leading-relaxed">
              Irreversible action.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 border border-border text-text-primary py-3 text-[10px] font-bold tracking-widest uppercase hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmDelete(deleteId)}
                className="flex-1 bg-primary text-bg py-3 text-[10px] font-bold tracking-widest uppercase transition-transform active:scale-95"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
