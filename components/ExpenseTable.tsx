"use client";

import { useState } from "react";
import { toast } from "sonner";
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
    "bg-transparent border-b border-border text-text-primary px-0 py-2 text-xs sm:text-sm focus:outline-none focus:border-primary transition-colors appearance-none cursor-pointer uppercase tracking-widest font-bold w-full";

  // Helper to render transaction item
  const renderTxItem = (tx: any) => {
    const isIncome = tx.type === "income";
    const isEditing = editingId === tx.id;

    if (isEditing) {
      return (
        <div key={tx.id} className="py-3 px-3 bg-text-primary/5 rounded-2xl space-y-3 my-2 border border-border/70">
          <div className="grid grid-cols-2 gap-2">
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
              <label className="text-[8px] font-black uppercase text-text-muted">Payment Mode</label>
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
            <label className="text-[8px] font-black uppercase text-text-muted">Description</label>
            <input
              type="text"
              value={editData.note}
              onChange={(e) => setEditData((p) => ({ ...p, note: e.target.value }))}
              className="w-full bg-transparent border-b border-border py-1 text-xs"
              placeholder="Note..."
            />
          </div>

          <div className="flex gap-2 justify-end pt-1">
            <button
              onClick={() => saveEdit(tx.id)}
              className="bg-text-primary text-bg px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm active:scale-95"
            >
              Save
            </button>
            <button
              onClick={() => setEditingId(null)}
              className="bg-border/60 text-text-muted px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest"
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
        className="py-2.5 sm:py-3 px-2 sm:px-3 flex items-center justify-between group/item hover:bg-text-primary/[0.03] rounded-2xl transition-colors gap-2"
      >
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
          <div className="w-9 h-9 min-w-[2.25rem] sm:w-10 sm:h-10 sm:min-w-[2.5rem] rounded-xl bg-card border border-border flex items-center justify-center text-base sm:text-lg shadow-inner">
            {getIcon(tx.category)}
          </div>

          <div className="min-w-0 flex-1">
            <p className="font-bold text-text-primary text-xs sm:text-sm tracking-tight truncate leading-tight">
              {tx.note || tx.category}
            </p>

            <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-bold text-text-muted uppercase tracking-widest mt-0.5">
              <span className="text-text-primary font-black">{formatTime(tx.createdAt) || "—"}</span>
              <span>•</span>
              <span className="capitalize opacity-80 truncate">{tx.category}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <p
            className={`font-black text-sm sm:text-base tracking-tight ${
              isIncome ? "text-green-500" : "text-red-500"
            }`}
          >
            {isIncome ? "+" : "-"}
            {formatCurrency(tx.amount)}
          </p>

          <div className="flex items-center gap-1 opacity-90 sm:opacity-0 sm:group-hover/item:opacity-100 transition-opacity">
            <button
              onClick={() => startEdit(tx)}
              className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-card border border-border text-text-muted hover:text-text-primary flex items-center justify-center text-[10px] sm:text-xs transition-colors"
              title="Edit"
            >
              ✏️
            </button>
            <button
              onClick={() => setDeleteId(tx.id)}
              className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-card border border-border text-text-muted hover:text-red-500 flex items-center justify-center text-[10px] sm:text-xs transition-colors"
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
    <div className="space-y-6">
      {/* Top Header & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg sm:text-xl font-black tracking-tight text-text-primary">
              Daily Feed & History
            </h2>
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest bg-text-primary/10 px-2 py-0.5 rounded-full text-text-primary">
              {filteredData.length}
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-text-muted mt-1 font-medium">
            Month: <span className="text-red-500 font-bold">-{formatCurrency(totalSpendInMonth)}</span> spent •{" "}
            <span className="text-green-500 font-bold">+{formatCurrency(totalIncomeInMonth)}</span> earned
          </p>
        </div>

        {/* View Switcher Toggle */}
        <div className="flex items-center gap-1.5 bg-text-primary/5 p-1 rounded-2xl border border-border/40 self-start sm:self-auto w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setViewMode("daily")}
            className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-center ${
              viewMode === "daily" ? "bg-text-primary text-bg shadow-sm" : "text-text-muted hover:text-text-primary"
            }`}
          >
            📅 Daily Feed
          </button>
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-center ${
              viewMode === "list" ? "bg-text-primary text-bg shadow-sm" : "text-text-muted hover:text-text-primary"
            }`}
          >
            📋 List View
          </button>
        </div>
      </div>

      {/* Filters Bar: Search, Month, Category, CSV */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-center">
        {/* Search */}
        <div className="relative w-full">
          <input
            type="text"
            placeholder="SEARCH NOTE, CATEGORY..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-transparent border-b border-border text-text-primary px-0 py-2 text-[10px] focus:outline-none focus:border-primary uppercase tracking-widest font-bold w-full placeholder:text-text-muted"
          />
        </div>

        {/* Month Dropdown */}
        <div className="relative w-full">
          <button
            onClick={() => setIsMonthOpen(!isMonthOpen)}
            className={`${selectClass} flex items-center justify-between`}
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
                <div className="max-h-56 overflow-y-auto py-1 custom-scrollbar">
                  {months.map((m) => (
                    <button
                      key={m}
                      onClick={() => {
                        handleMonthChange(m);
                        setIsMonthOpen(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-[10px] font-bold uppercase tracking-widest transition-colors ${
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

        {/* Category Dropdown */}
        <div className="relative w-full">
          <button
            onClick={() => setIsCatOpen(!isCatOpen)}
            className={`${selectClass} flex items-center justify-between`}
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
                <div className="max-h-56 overflow-y-auto py-1 custom-scrollbar">
                  <button
                    onClick={() => {
                      handleCategoryChange("");
                      setIsCatOpen(false);
                    }}
                    className={`w-full px-4 py-2 text-left text-[10px] font-bold uppercase tracking-widest transition-colors ${
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
                      className={`w-full px-4 py-2 text-left text-[10px] font-bold uppercase tracking-widest transition-colors ${
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

        {/* Download CSV */}
        <button
          onClick={downloadCSV}
          className="text-[10px] font-bold uppercase tracking-widest border border-border px-4 py-2 hover:bg-text-primary/5 transition-colors text-text-primary rounded-full shadow-sm text-center w-full"
        >
          Download CSV
        </button>
      </div>

      {loading ? (
        <div className="space-y-4 py-8">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 w-full bg-card/40 border border-border rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredData.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-2xl px-4">
          <p className="text-3xl mb-2">🔍</p>
          <p className="text-text-primary font-bold text-sm">No transactions found</p>
          <p className="text-text-muted text-[10px] font-bold uppercase tracking-widest mt-1">
            Try adjusting your filters or date
          </p>
        </div>
      ) : viewMode === "daily" ? (
        /* DAILY GROUPED TIMELINE FEED */
        <div className="space-y-5">
          {dayGroups.map((group) => (
            <div
              key={group.date}
              className="bg-card border border-border rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm relative overflow-hidden transition-all space-y-4"
            >
              {/* Day Header with Badges */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-border/60 gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-text-primary shrink-0" />
                  <div>
                    <h3 className="text-base sm:text-lg font-black tracking-tight text-text-primary leading-tight">
                      {group.relativeDate}{" "}
                      <span className="text-xs font-normal text-text-muted">({group.formattedDate})</span>
                    </h3>
                  </div>
                </div>

                {/* Day Summary Badges (Mobile-friendly Grid/Flex) */}
                <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-3 flex-wrap">
                  {/* Cash Pill */}
                  <div className="bg-text-primary/5 px-2.5 py-1 rounded-xl border border-border/40 flex items-center gap-1.5">
                    <span className="text-xs">💵</span>
                    <div className="min-w-0">
                      <p className="text-[7px] sm:text-[8px] font-black uppercase tracking-widest text-text-muted">Cash</p>
                      <p className="text-[11px] sm:text-xs font-black text-text-primary truncate">
                        {group.cashSpent > 0 && <span className="text-red-500">-{formatCurrency(group.cashSpent)}</span>}
                        {group.cashSpent > 0 && group.cashIncome > 0 && <span>/</span>}
                        {group.cashIncome > 0 && <span className="text-green-500">+{formatCurrency(group.cashIncome)}</span>}
                        {group.cashSpent === 0 && group.cashIncome === 0 && <span className="text-text-muted">₹0</span>}
                      </p>
                    </div>
                  </div>

                  {/* Online Pill */}
                  <div className="bg-text-primary/5 px-2.5 py-1 rounded-xl border border-border/40 flex items-center gap-1.5">
                    <span className="text-xs">💳</span>
                    <div className="min-w-0">
                      <p className="text-[7px] sm:text-[8px] font-black uppercase tracking-widest text-text-muted">Online</p>
                      <p className="text-[11px] sm:text-xs font-black text-text-primary truncate">
                        {group.onlineSpent > 0 && <span className="text-red-500">-{formatCurrency(group.onlineSpent)}</span>}
                        {group.onlineSpent > 0 && group.onlineIncome > 0 && <span>/</span>}
                        {group.onlineIncome > 0 && <span className="text-green-500">+{formatCurrency(group.onlineIncome)}</span>}
                        {group.onlineSpent === 0 && group.onlineIncome === 0 && <span className="text-text-muted">₹0</span>}
                      </p>
                    </div>
                  </div>

                  {/* Day Total */}
                  <div className="bg-text-primary/10 px-2.5 py-1 rounded-xl border border-border/60">
                    <p className="text-[7px] sm:text-[8px] font-black uppercase tracking-widest text-text-muted">Day Total</p>
                    <p className="text-[11px] sm:text-xs font-black">
                      {group.totalSpent > 0 && <span className="text-red-500">-{formatCurrency(group.totalSpent)} </span>}
                      {group.totalIncome > 0 && <span className="text-green-500">+{formatCurrency(group.totalIncome)}</span>}
                    </p>
                  </div>

                  {/* Month to Date */}
                  <div className="bg-card border border-border px-2.5 py-1 rounded-xl shadow-inner">
                    <p className="text-[7px] sm:text-[8px] font-black uppercase tracking-widest text-text-muted">Month to Date</p>
                    <p className="text-[11px] sm:text-xs font-black text-text-primary">{formatCurrency(group.cumulativeMonthSpent)}</p>
                  </div>
                </div>
              </div>

              {/* Two-Column Divided Section inside Single Card: Cash vs Online */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 divide-y md:divide-y-0 md:divide-x divide-border/60">
                {/* 1. Cash Column */}
                <div className="space-y-2.5 pt-2 md:pt-0 md:pr-4">
                  <div className="flex items-center justify-between pb-1.5 border-b border-border/30">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs">💵</span>
                      <h4 className="text-[11px] sm:text-xs font-black uppercase tracking-widest text-text-primary">
                        Cash ({group.cashTransactions.length})
                      </h4>
                    </div>
                    <span className="text-[10px] font-black text-text-muted">
                      {group.cashSpent > 0 ? `-${formatCurrency(group.cashSpent)}` : "₹0.00"}
                    </span>
                  </div>

                  {group.cashTransactions.length === 0 ? (
                    <div className="py-4 text-center text-text-muted/60 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest border border-dashed border-border/40 rounded-xl">
                      No cash transactions
                    </div>
                  ) : (
                    <div className="divide-y divide-border/20">
                      {group.cashTransactions.map((tx) => renderTxItem(tx))}
                    </div>
                  )}
                </div>

                {/* 2. Online Column */}
                <div className="space-y-2.5 pt-3 md:pt-0 md:pl-6">
                  <div className="flex items-center justify-between pb-1.5 border-b border-border/30">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs">💳</span>
                      <h4 className="text-[11px] sm:text-xs font-black uppercase tracking-widest text-text-primary">
                        Online / UPI ({group.onlineTransactions.length})
                      </h4>
                    </div>
                    <span className="text-[10px] font-black text-text-muted">
                      {group.onlineSpent > 0 ? `-${formatCurrency(group.onlineSpent)}` : "₹0.00"}
                    </span>
                  </div>

                  {group.onlineTransactions.length === 0 ? (
                    <div className="py-4 text-center text-text-muted/60 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest border border-dashed border-border/40 rounded-xl">
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
          <div className="md:hidden divide-y divide-border/60">
            {paginated.map((expense) => {
              const isIncome = expense.type === "income";
              return (
                <div key={expense.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 min-w-[2.25rem] border border-border rounded-xl flex items-center justify-center text-base shrink-0">
                      {getIcon(expense.category)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-text-primary font-bold text-xs truncate leading-tight">
                          {expense.note || expense.category}
                        </p>
                        <span className="text-[8px] font-black uppercase tracking-wider text-text-muted bg-text-primary/5 px-1.5 py-0.5 rounded border border-border/40 shrink-0">
                          {expense.paymentMethod || "online"}
                        </span>
                      </div>
                      <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest mt-0.5">
                        {formatTransactionDateTime(expense.date, expense.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`font-black text-sm ${isIncome ? "text-green-500" : "text-red-500"}`}>
                      {isIncome ? "+" : "-"}
                      {formatCurrency(expense.amount)}
                    </p>
                    <div className="flex gap-2 justify-end mt-1">
                      <button
                        onClick={() => startEdit(expense)}
                        className="text-[9px] font-black uppercase text-text-muted hover:text-text-primary bg-text-primary/5 px-2 py-0.5 rounded border border-border/30"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteId(expense.id)}
                        className="text-[9px] font-black uppercase text-red-400 hover:text-red-500 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20"
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
            <div className="flex items-center justify-between pt-6 border-t border-border">
              <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
                Page <span className="text-text-primary font-black">{currentPage}</span> of {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3.5 py-1.5 rounded-full border border-border text-[9px] sm:text-[10px] uppercase tracking-widest font-bold text-text-primary disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/5 transition-all"
                >
                  Prev
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3.5 py-1.5 rounded-full border border-border text-[9px] sm:text-[10px] uppercase tracking-widest font-bold text-text-primary disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/5 transition-all"
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
        <div className="fixed inset-0 bg-bg/90 backdrop-blur-sm flex items-center justify-center z-[100] animate-fade-in p-4">
          <div className="bg-card border border-border p-6 sm:p-8 rounded-3xl max-w-sm w-full animate-slide-up shadow-2xl">
            <h3 className="text-text-primary font-bold text-lg sm:text-xl mb-2 tracking-tighter">Delete Transaction?</h3>
            <p className="text-text-muted text-xs mb-6 sm:mb-8 leading-relaxed">
              This will remove the transaction and automatically adjust your wallet balances and daily/monthly totals.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 border border-border text-text-primary py-2.5 sm:py-3 rounded-2xl text-[10px] font-bold tracking-widest uppercase hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmDelete(deleteId)}
                className="flex-1 bg-red-500 text-white py-2.5 sm:py-3 rounded-2xl text-[10px] font-bold tracking-widest uppercase transition-transform active:scale-95 shadow-lg shadow-red-500/20"
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
