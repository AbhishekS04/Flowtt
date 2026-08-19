"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Expense } from "@/lib/schema";
import {
  formatCurrency,
  getCategoryIcon,
  getMonthString,
  formatTime,
  formatTransactionDate,
  formatRelativeDate,
  formatTransactionDateTime,
  groupTransactionsByDay,
  DayGroup,
} from "@/lib/utils";

interface ExpenseTableProps {
  initialExpenses: any[];
  categories: { id: string; name: string; icon: string }[];
}

const ITEMS_PER_PAGE = 15;

export default function ExpenseTable({ initialExpenses, categories }: ExpenseTableProps) {
  const [expenses, setExpenses] = useState<any[]>(initialExpenses);
  const [viewMode, setViewMode] = useState<"daily" | "list">("daily");

  const getIcon = (catName: string) => {
    const custom = categories.find((c) => c.name.toLowerCase() === catName.toLowerCase());
    return custom ? custom.icon : getCategoryIcon(catName);
  };

  const [selectedMonth, setSelectedMonth] = useState(getMonthString());
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isMonthOpen, setIsMonthOpen] = useState(false);
  const [isCatOpen, setIsCatOpen] = useState(false);
  const [isEditCatOpen, setIsEditCatOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({
    amount: "",
    category: "",
    date: "",
    time: "12:00",
    note: "",
    paymentMethod: "online",
    type: "expense",
  });
  const [loading, setLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchExpenses = async (month: string, category: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ month });
      if (category) params.set("category", category);
      const res = await fetch(`/api/transactions?${params}`);
      if (res.ok) {
        const data = await res.json();
        setExpenses(data);
        setCurrentPage(1);
      }
    } catch (err) {
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
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
    let timeVal = "12:00";
    if (expense.createdAt) {
      const d = new Date(expense.createdAt);
      if (!isNaN(d.getTime())) {
        timeVal = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
      }
    }
    setEditData({
      amount: expense.amount,
      category: expense.category,
      date: expense.date,
      time: timeVal,
      note: expense.note ?? "",
      paymentMethod: expense.paymentMethod ?? "online",
      type: expense.type,
    });
  };

  const saveEdit = async (id: string) => {
    const isIncome = editData.type === "income";
    const endpoint = isIncome ? `/api/incomes/${id}` : `/api/expenses/${id}`;

    // Construct local timestamp
    const [h, m] = (editData.time || "12:00").split(":");
    const dObj = new Date(editData.date);
    dObj.setHours(parseInt(h, 10) || 0, parseInt(m, 10) || 0, 0, 0);

    const payload = isIncome
      ? {
          amount: parseFloat(editData.amount),
          source: editData.category,
          date: editData.date,
          createdAt: dObj.toISOString(),
          note: editData.note,
          paymentMethod: editData.paymentMethod,
        }
      : {
          amount: parseFloat(editData.amount),
          category: editData.category,
          date: editData.date,
          createdAt: dObj.toISOString(),
          note: editData.note,
          paymentMethod: editData.paymentMethod,
        };

    const res = await fetch(endpoint, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      toast.success("Transaction updated");
      setEditingId(null);
      fetchExpenses(selectedMonth, selectedCategory);
    } else {
      toast.error("Failed to update transaction");
    }
  };

  const confirmDelete = async (id: string) => {
    const item = expenses.find((e: any) => e.id === id);
    if (!item) return;
    const endpoint = item.type === "income" ? `/api/incomes/${id}` : `/api/expenses/${id}`;
    const res = await fetch(endpoint, { method: "DELETE" });
    if (res.ok) {
      toast.success("Transaction deleted");
      setDeleteId(null);
      setExpenses((prev) => prev.filter((e) => e.id !== id));
    } else {
      toast.error("Failed to delete transaction");
    }
  };

  const downloadCSV = () => {
    if (expenses.length === 0) {
      toast.error("No data to export");
      return;
    }
    const headers = ["Date", "Time", "Type", "Category/Source", "Payment Method", "Amount", "Note"];
    const rows = expenses.map((e) => [
      e.date,
      formatTime(e.createdAt),
      e.type,
      e.category,
      e.paymentMethod || "online",
      e.amount,
      `"${(e.note || "").replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `transactions_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredData = expenses.filter((e) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (e.note && e.note.toLowerCase().includes(q)) ||
      (e.category && e.category.toLowerCase().includes(q)) ||
      e.amount.toString().includes(q) ||
      (e.paymentMethod && e.paymentMethod.toLowerCase().includes(q))
    );
  });

  const dayGroups = groupTransactionsByDay(filteredData);
  const totalSpendInMonth = filteredData
    .filter((e) => e.type === "expense")
    .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
  const totalIncomeInMonth = filteredData
    .filter((e) => e.type === "income")
    .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginated = filteredData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const months: string[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(getMonthString(d));
  }

  const selectClass =
    "bg-transparent border-b border-border text-text-primary px-0 py-2 text-sm focus:outline-none focus:border-primary transition-colors appearance-none cursor-pointer uppercase tracking-widest font-bold w-full md:w-auto min-w-[140px]";

  // Helper to render transaction item
  const renderTxItem = (tx: any) => {
    const isIncome = tx.type === "income";
    const isEditing = editingId === tx.id;

    if (isEditing) {
      return (
        <div key={tx.id} className="py-3 px-3 bg-text-primary/5 rounded-2xl space-y-3 my-2 border border-border/60">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div>
              <label className="text-[8px] font-black uppercase text-text-muted">Date</label>
              <input
                type="date"
                value={editData.date}
                onChange={(e) => setEditData((p) => ({ ...p, date: e.target.value }))}
                className="w-full bg-transparent border-b border-border py-1 text-[11px] font-bold"
              />
            </div>
            <div>
              <label className="text-[8px] font-black uppercase text-text-muted">Time</label>
              <input
                type="time"
                value={editData.time}
                onChange={(e) => setEditData((p) => ({ ...p, time: e.target.value }))}
                className="w-full bg-transparent border-b border-border py-1 text-[11px] font-bold"
              />
            </div>
            <div>
              <label className="text-[8px] font-black uppercase text-text-muted">Amount (₹)</label>
              <input
                type="number"
                step="0.01"
                value={editData.amount}
                onChange={(e) => setEditData((p) => ({ ...p, amount: e.target.value }))}
                className="w-full bg-transparent border-b border-border py-1 text-[11px] font-bold"
              />
            </div>
            <div>
              <label className="text-[8px] font-black uppercase text-text-muted">Payment Method</label>
              <select
                value={editData.paymentMethod}
                onChange={(e) => setEditData((p) => ({ ...p, paymentMethod: e.target.value }))}
                className="w-full bg-transparent border-b border-border py-1 text-[11px] font-bold uppercase"
              >
                <option value="cash" className="bg-card text-text-primary">Cash</option>
                <option value="online" className="bg-card text-text-primary">Online</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[8px] font-black uppercase text-text-muted">Note / Description</label>
            <input
              type="text"
              value={editData.note}
              onChange={(e) => setEditData((p) => ({ ...p, note: e.target.value }))}
              className="w-full bg-transparent border-b border-border py-1 text-xs"
              placeholder="Description"
            />
          </div>

          <div className="flex gap-2 justify-end pt-1">
            <button
              onClick={() => saveEdit(tx.id)}
              className="bg-text-primary text-bg px-3.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm"
            >
              Save
            </button>
            <button
              onClick={() => setEditingId(null)}
              className="bg-border/60 text-text-muted px-3.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest"
            >
              Cancel
            </button>
          </div>
        </div>
      );
    }

    return (
      <div
        key={tx.id}
        className="py-3 px-3 flex items-center justify-between group/item hover:bg-text-primary/[0.03] rounded-2xl transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 min-w-[2.5rem] rounded-xl bg-card border border-border flex items-center justify-center text-lg shadow-inner">
            {getIcon(tx.category)}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-bold text-text-primary text-sm tracking-tight truncate">
                {tx.note || tx.category}
              </p>
            </div>

            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-0.5 flex items-center gap-1.5">
              <span className="text-text-primary font-black">{formatTime(tx.createdAt) || "—"}</span>
              <span>•</span>
              <span className="capitalize opacity-80">{tx.category}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p
              className={`font-black text-base tracking-tight ${
                isIncome ? "text-green-500" : "text-red-500"
              }`}
            >
              {isIncome ? "+" : "-"}
              {formatCurrency(tx.amount)}
            </p>
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
            <button
              onClick={() => startEdit(tx)}
              className="w-7 h-7 rounded-lg bg-card border border-border text-text-muted hover:text-text-primary flex items-center justify-center text-xs transition-colors"
              title="Edit"
            >
              ✏️
            </button>
            <button
              onClick={() => setDeleteId(tx.id)}
              className="w-7 h-7 rounded-lg bg-card border border-border text-text-muted hover:text-red-500 flex items-center justify-center text-xs transition-colors"
              title="Delete"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Top Controls & Summary Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2 border-b border-border/60">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-black tracking-tight text-text-primary">Daily Feed & Transactions</h2>
            <span className="text-[10px] font-black uppercase tracking-widest bg-text-primary/10 px-2.5 py-1 rounded-full text-text-primary">
              {filteredData.length} Total
            </span>
          </div>
          <p className="text-xs text-text-muted mt-1 font-medium">
            Month Totals: <span className="text-red-500 font-bold">-{formatCurrency(totalSpendInMonth)}</span> spent •{" "}
            <span className="text-green-500 font-bold">+{formatCurrency(totalIncomeInMonth)}</span> earned
          </p>
        </div>

        {/* View Switcher (Daily Grouped vs Flat List) */}
        <div className="flex items-center gap-2 bg-text-primary/5 p-1.5 rounded-2xl border border-border/40 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode("daily")}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              viewMode === "daily" ? "bg-text-primary text-bg shadow-sm" : "text-text-muted hover:text-text-primary"
            }`}
          >
            📅 Daily Feed
          </button>
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              viewMode === "list" ? "bg-text-primary text-bg shadow-sm" : "text-text-muted hover:text-text-primary"
            }`}
          >
            📋 List View
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
        <div className="flex flex-col md:flex-row gap-6 w-full md:flex-grow z-30">
          {/* Search Filter */}
          <div className="relative min-w-[140px] md:min-w-[200px]">
            <input
              type="text"
              placeholder="SEARCH DESCRIPTION, CATEGORY..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent border-b border-border text-text-primary px-0 py-2 text-[10px] focus:outline-none focus:border-primary uppercase tracking-widest font-bold w-full placeholder:text-text-muted"
            />
          </div>

          {/* Month Filter */}
          <div className="relative min-w-[140px]">
            <button
              onClick={() => setIsMonthOpen(!isMonthOpen)}
              className={`${selectClass} flex items-center justify-between group/drop`}
            >
              <span>{selectedMonth}</span>
              <svg
                className={`w-3 h-3 transition-transform duration-300 ${isMonthOpen ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {isMonthOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsMonthOpen(false)} />
                <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-card border border-border shadow-2xl rounded-2xl overflow-hidden animate-slide-up-subtle">
                  <div className="max-h-60 overflow-y-auto py-1 custom-scrollbar">
                    {months.map((m) => (
                      <button
                        key={m}
                        onClick={() => {
                          handleMonthChange(m);
                          setIsMonthOpen(false);
                        }}
                        className={`w-full px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest transition-colors ${
                          selectedMonth === m
                            ? "bg-text-primary text-bg"
                            : "hover:bg-text-primary/5 text-text-primary"
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
              <svg
                className={`w-3 h-3 transition-transform duration-300 ${isCatOpen ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {isCatOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsCatOpen(false)} />
                <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-card border border-border shadow-2xl rounded-2xl overflow-hidden animate-slide-up-subtle">
                  <div className="max-h-60 overflow-y-auto py-1 custom-scrollbar">
                    <button
                      onClick={() => {
                        handleCategoryChange("");
                        setIsCatOpen(false);
                      }}
                      className={`w-full px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest transition-colors ${
                        selectedCategory === ""
                          ? "bg-text-primary text-bg"
                          : "hover:bg-text-primary/5 text-text-primary"
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
                          selectedCategory === c.name
                            ? "bg-text-primary text-bg"
                            : "hover:bg-text-primary/5 text-text-primary"
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
          className="text-[10px] font-bold uppercase tracking-widest border border-border px-6 py-2.5 hover:bg-text-primary/5 transition-colors text-text-primary whitespace-nowrap rounded-full shadow-sm"
        >
          Download CSV
        </button>
      </div>

      {loading ? (
        <div className="space-y-4 py-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 w-full bg-card/40 border border-border rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : filteredData.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border rounded-3xl">
          <p className="text-3xl mb-2">🔍</p>
          <p className="text-text-primary font-bold text-sm">No transactions found</p>
          <p className="text-text-muted text-[10px] font-bold uppercase tracking-widest mt-1">
            Try adjusting your search or filters
          </p>
        </div>
      ) : viewMode === "daily" ? (
        /* DAILY GROUPED TIMELINE VIEW: DIVIDED INTO CASH VS ONLINE */
        <div className="space-y-8">
          {dayGroups.map((group) => (
            <div
              key={group.date}
              className="bg-card border border-border rounded-[2rem] p-6 sm:p-7 shadow-sm relative overflow-hidden transition-all space-y-6"
            >
              {/* Day Header with Combined & Split Totals */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-5 border-b border-border/60 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-text-primary" />
                  <div>
                    <h3 className="text-lg font-black tracking-tight text-text-primary">
                      {group.relativeDate}{" "}
                      <span className="text-xs font-normal text-text-muted">({group.formattedDate})</span>
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                  {/* Cash Summary Pill */}
                  <div className="bg-text-primary/5 px-3 py-1.5 rounded-2xl border border-border/40 flex items-center gap-2">
                    <span className="text-xs">💵</span>
                    <div>
                      <p className="text-[8px] font-black uppercase tracking-widest text-text-muted">Cash</p>
                      <p className="text-xs font-black text-text-primary">
                        {group.cashSpent > 0 && <span className="text-red-500">-{formatCurrency(group.cashSpent)}</span>}
                        {group.cashSpent > 0 && group.cashIncome > 0 && <span> / </span>}
                        {group.cashIncome > 0 && <span className="text-green-500">+{formatCurrency(group.cashIncome)}</span>}
                        {group.cashSpent === 0 && group.cashIncome === 0 && <span className="text-text-muted">₹0.00</span>}
                      </p>
                    </div>
                  </div>

                  {/* Online Summary Pill */}
                  <div className="bg-text-primary/5 px-3 py-1.5 rounded-2xl border border-border/40 flex items-center gap-2">
                    <span className="text-xs">💳</span>
                    <div>
                      <p className="text-[8px] font-black uppercase tracking-widest text-text-muted">Online</p>
                      <p className="text-xs font-black text-text-primary">
                        {group.onlineSpent > 0 && <span className="text-red-500">-{formatCurrency(group.onlineSpent)}</span>}
                        {group.onlineSpent > 0 && group.onlineIncome > 0 && <span> / </span>}
                        {group.onlineIncome > 0 && <span className="text-green-500">+{formatCurrency(group.onlineIncome)}</span>}
                        {group.onlineSpent === 0 && group.onlineIncome === 0 && <span className="text-text-muted">₹0.00</span>}
                      </p>
                    </div>
                  </div>

                  {/* Day Total */}
                  <div className="bg-text-primary/10 px-3.5 py-1.5 rounded-2xl border border-border/60">
                    <p className="text-[8px] font-black uppercase tracking-widest text-text-muted">Day Total</p>
                    <p className="text-xs font-black">
                      {group.totalSpent > 0 && <span className="text-red-500">-{formatCurrency(group.totalSpent)} </span>}
                      {group.totalIncome > 0 && <span className="text-green-500">+{formatCurrency(group.totalIncome)}</span>}
                    </p>
                  </div>

                  {/* Month to Date */}
                  <div className="bg-card border border-border px-3.5 py-1.5 rounded-2xl shadow-inner">
                    <p className="text-[8px] font-black uppercase tracking-widest text-text-muted">Month to Date</p>
                    <p className="text-xs font-black text-text-primary">{formatCurrency(group.cumulativeMonthSpent)}</p>
                  </div>
                </div>
              </div>

              {/* Two-Column Divided Section inside Single Card: Cash vs Online */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 divide-y md:divide-y-0 md:divide-x divide-border/60">
                {/* 1. Cash Column */}
                <div className="space-y-3 pt-2 md:pt-0 md:pr-4">
                  <div className="flex items-center justify-between pb-2 border-b border-border/30">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">💵</span>
                      <h4 className="text-xs font-black uppercase tracking-widest text-text-primary">
                        Cash Transactions ({group.cashTransactions.length})
                      </h4>
                    </div>
                    <span className="text-[10px] font-black text-text-muted">
                      {group.cashSpent > 0 ? `-${formatCurrency(group.cashSpent)}` : "₹0.00"}
                    </span>
                  </div>

                  {group.cashTransactions.length === 0 ? (
                    <div className="py-6 text-center text-text-muted/60 text-[10px] font-bold uppercase tracking-widest border border-dashed border-border/40 rounded-2xl">
                      No cash transactions
                    </div>
                  ) : (
                    <div className="divide-y divide-border/20">
                      {group.cashTransactions.map((tx) => renderTxItem(tx))}
                    </div>
                  )}
                </div>

                {/* 2. Online Column */}
                <div className="space-y-3 pt-4 md:pt-0 md:pl-6">
                  <div className="flex items-center justify-between pb-2 border-b border-border/30">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">💳</span>
                      <h4 className="text-xs font-black uppercase tracking-widest text-text-primary">
                        Online / UPI Transactions ({group.onlineTransactions.length})
                      </h4>
                    </div>
                    <span className="text-[10px] font-black text-text-muted">
                      {group.onlineSpent > 0 ? `-${formatCurrency(group.onlineSpent)}` : "₹0.00"}
                    </span>
                  </div>

                  {group.onlineTransactions.length === 0 ? (
                    <div className="py-6 text-center text-text-muted/60 text-[10px] font-bold uppercase tracking-widest border border-dashed border-border/40 rounded-2xl">
                      No online transactions
                    </div>
                  ) : (
                    <div className="divide-y divide-border/20">
                      {group.onlineTransactions.map((tx) => renderTxItem(tx))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* FLAT LIST / TABLE VIEW */
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block w-full">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-border text-text-muted font-bold text-[10px] uppercase tracking-widest">
                  <th className="text-left py-4 px-2 w-[20%]">Date & Time</th>
                  <th className="text-left py-4 px-2 w-[18%]">Category</th>
                  <th className="text-left py-4 px-2 w-[14%]">Payment Method</th>
                  <th className="text-left py-4 px-2 w-[24%]">Note</th>
                  <th className="text-right py-4 px-2 w-[14%]">Amount</th>
                  <th className="text-right py-4 px-2 w-[10%]"></th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((expense) => {
                  const isIncome = expense.type === "income";
                  const isEditing = editingId === expense.id;

                  if (isEditing) {
                    return (
                      <tr key={expense.id} className="border-b border-border">
                        <td className="py-3 px-2">
                          <div className="flex gap-2">
                            <input
                              type="date"
                              value={editData.date}
                              onChange={(e) => setEditData((p) => ({ ...p, date: e.target.value }))}
                              className="bg-transparent border-b border-border text-text-primary text-[10px] uppercase font-bold"
                            />
                            <input
                              type="time"
                              value={editData.time}
                              onChange={(e) => setEditData((p) => ({ ...p, time: e.target.value }))}
                              className="bg-transparent border-b border-border text-text-primary text-[10px] font-bold"
                            />
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <input
                            type="text"
                            value={editData.category}
                            onChange={(e) => setEditData((p) => ({ ...p, category: e.target.value }))}
                            className="bg-transparent border-b border-border text-text-primary text-[10px] font-bold w-full"
                          />
                        </td>
                        <td className="py-3 px-2">
                          <select
                            value={editData.paymentMethod}
                            onChange={(e) => setEditData((p) => ({ ...p, paymentMethod: e.target.value }))}
                            className="bg-transparent border-b border-border text-text-primary text-[10px] font-bold uppercase"
                          >
                            <option value="cash" className="bg-card text-text-primary">Cash</option>
                            <option value="online" className="bg-card text-text-primary">Online</option>
                          </select>
                        </td>
                        <td className="py-3 px-2">
                          <input
                            type="text"
                            value={editData.note}
                            onChange={(e) => setEditData((p) => ({ ...p, note: e.target.value }))}
                            className="bg-transparent border-b border-border text-text-primary text-xs w-full"
                          />
                        </td>
                        <td className="py-3 px-2 text-right">
                          <input
                            type="number"
                            value={editData.amount}
                            onChange={(e) => setEditData((p) => ({ ...p, amount: e.target.value }))}
                            className="bg-transparent border-b border-border text-text-primary text-sm font-bold text-right w-24"
                          />
                        </td>
                        <td className="py-3 px-2 text-right space-x-2">
                          <button
                            onClick={() => saveEdit(expense.id)}
                            className="text-text-primary font-bold text-[10px] uppercase tracking-widest hover:underline"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="text-text-muted font-bold text-[10px] uppercase tracking-widest hover:text-text-primary"
                          >
                            Cancel
                          </button>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={expense.id} className="border-b border-border hover:bg-white/[0.02] transition-colors group">
                      <td className="py-4 px-2">
                        <div className="flex flex-col">
                          <span className="text-text-primary font-bold text-xs tracking-tight">
                            {formatTransactionDate(expense.date)}
                          </span>
                          <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                            {formatTime(expense.createdAt) || "—"}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-2">
                        <span className="inline-flex items-center gap-3">
                          <span className="text-xl">{getIcon(expense.category)}</span>
                          <span className="uppercase text-text-primary text-[10px] font-bold tracking-widest">
                            {expense.category}
                          </span>
                        </span>
                      </td>
                      <td className="py-4 px-2">
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${
                          (expense.paymentMethod || "online").toLowerCase() === "cash"
                            ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                            : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                        }`}>
                          {expense.paymentMethod || "online"}
                        </span>
                      </td>
                      <td className="py-4 px-2 text-text-muted text-xs">
                        <p className="truncate max-w-xs">{expense.note ?? "—"}</p>
                      </td>
                      <td
                        className={`py-4 px-2 text-right font-bold text-base tracking-tighter ${
                          isIncome ? "text-green-500" : "text-red-500"
                        }`}
                      >
                        {isIncome ? "+" : "-"}
                        {formatCurrency(expense.amount)}
                      </td>
                      <td className="py-4 px-2 text-right space-x-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => startEdit(expense)}
                          className="text-text-primary text-[10px] font-bold uppercase tracking-widest hover:underline transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteId(expense.id)}
                          className="text-text-muted text-[10px] font-bold uppercase tracking-widest hover:text-red-500 transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile List View */}
          <div className="md:hidden space-y-0 divide-y divide-border">
            {paginated.map((expense) => {
              const isIncome = expense.type === "income";
              return (
                <div key={expense.id} className="py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 border border-border rounded-2xl flex items-center justify-center text-lg">
                      {getIcon(expense.category)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-text-primary font-bold text-xs truncate">{expense.note || expense.category}</p>
                        <span className="text-[8px] font-bold uppercase tracking-wider text-text-muted bg-text-primary/5 px-1.5 py-0.5 rounded">
                          {expense.paymentMethod || "online"}
                        </span>
                      </div>
                      <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-0.5">
                        {formatTransactionDateTime(expense.date, expense.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-base ${isIncome ? "text-green-500" : "text-red-500"}`}>
                      {isIncome ? "+" : "-"}
                      {formatCurrency(expense.amount)}
                    </p>
                    <div className="flex gap-2 justify-end mt-1">
                      <button
                        onClick={() => startEdit(expense)}
                        className="text-[9px] font-bold uppercase text-text-muted hover:text-text-primary"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteId(expense.id)}
                        className="text-[9px] font-bold uppercase text-text-muted hover:text-red-500"
                      >
                        Del
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-8 border-t border-border">
              <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
                Page <span className="text-text-primary">{currentPage}</span> of {totalPages}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-full border border-border text-[10px] uppercase tracking-widest font-bold text-text-primary disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/5 transition-all"
                >
                  Prev
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-full border border-border text-[10px] uppercase tracking-widest font-bold text-text-primary disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/5 transition-all"
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
          <div className="bg-card border border-border p-8 rounded-3xl max-w-sm w-full animate-slide-up shadow-2xl">
            <h3 className="text-text-primary font-bold text-xl mb-2 tracking-tighter">Delete Transaction?</h3>
            <p className="text-text-muted text-xs mb-8 leading-relaxed">
              This will remove the transaction and update your balances and monthly totals.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 border border-border text-text-primary py-3 rounded-2xl text-[10px] font-bold tracking-widest uppercase hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmDelete(deleteId)}
                className="flex-1 bg-red-500 text-white py-3 rounded-2xl text-[10px] font-bold tracking-widest uppercase transition-transform active:scale-95 shadow-lg shadow-red-500/20"
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
