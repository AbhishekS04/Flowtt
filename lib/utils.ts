// Internal defaults used for seeding only
const DEFAULT_CATEGORY_COLORS: Record<string, string> = {
  food: "#ef4444", // red-500
  transport: "#3b82f6", // blue-500
  entertainment: "#8b5cf6", // violet-500
  health: "#10b981", // emerald-500
  shopping: "#ec4899", // pink-500
  other: "#a8a29e", // stone-400
  investments: "#eab308", // yellow-500
  bills: "#f97316", // orange-500
  education: "#06b6d4", // cyan-500
};

export function formatCurrency(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(num);
}

export function getMonthString(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function getCategoryColor(category: string): string {
  const baseColor = DEFAULT_CATEGORY_COLORS[category.toLowerCase()];
  if (baseColor) return baseColor;

  // Modern vibrant and distinct colors for custom categories
  const colors = [
    "#f43f5e", // rose-500
    "#14b8a6", // teal-500
    "#d946ef", // fuchsia-500
    "#84cc16", // lime-500
    "#6366f1", // indigo-500
    "#f59e0b", // amber-500
    "#22d3ee", // cyan-400
    "#a855f7", // purple-500
    "#fb923c", // orange-400
    "#34d399", // emerald-400
  ];
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function getCategoryIcon(category: string): string {
  // This will be replaced by the DB icon in most components.
  // We keep it as a fallback for old data or unmapped categories.
  const icons: Record<string, string> = { food: "🍔", transport: "🚗", entertainment: "🎬", health: "💊", shopping: "🛍️" };
  return icons[category.toLowerCase()] ?? "📦";
}

export function getDaysInMonth(monthStr: string): number {
  const [year, month] = monthStr.split("-").map(Number);
  return new Date(year, month, 0).getDate();
}

export function getDaysRemainingInMonth(): number {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return lastDay.getDate() - now.getDate();
}

export function formatTime(dateOrTimestamp: string | Date | null | undefined): string {
  if (!dateOrTimestamp) return "";
  try {
    const d = typeof dateOrTimestamp === "string" ? new Date(dateOrTimestamp) : dateOrTimestamp;
    if (isNaN(d.getTime())) return "";
    return d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "";
  }
}

export function formatTransactionDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const [y, m, d] = dateStr.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function formatRelativeDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const tzOffset = (new Date()).getTimezoneOffset() * 60000;
    const todayStr = (new Date(Date.now() - tzOffset)).toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - tzOffset - 86400000).toISOString().split("T")[0];

    if (dateStr === todayStr) return "Today";
    if (dateStr === yesterday) return "Yesterday";

    const [y, m, d] = dateStr.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  } catch {
    return dateStr;
  }
}

export function formatTransactionDateTime(dateStr: string, createdAt?: string | Date | null | undefined): string {
  const dateFormatted = formatRelativeDate(dateStr);
  const timeFormatted = formatTime(createdAt);
  if (timeFormatted) {
    return `${dateFormatted} • ${timeFormatted}`;
  }
  return dateFormatted;
}

export interface DayGroup {
  date: string;
  formattedDate: string;
  relativeDate: string;
  totalSpent: number;
  totalIncome: number;
  netAmount: number;
  cumulativeMonthSpent: number;
  transactions: any[];
}

export function groupTransactionsByDay(transactions: any[]): DayGroup[] {
  const groups: Record<string, { date: string; transactions: any[]; totalSpent: number; totalIncome: number }> = {};

  for (const t of transactions) {
    const dateKey = t.date;
    if (!groups[dateKey]) {
      groups[dateKey] = {
        date: dateKey,
        transactions: [],
        totalSpent: 0,
        totalIncome: 0,
      };
    }
    groups[dateKey].transactions.push(t);
    const amount = parseFloat(t.amount || "0");
    if (t.type === "expense") {
      groups[dateKey].totalSpent += amount;
    } else {
      groups[dateKey].totalIncome += amount;
    }
  }

  // Sort dates descending
  const sortedDates = Object.keys(groups).sort((a, b) => b.localeCompare(a));

  // Compute month-to-date cumulative spend (chronological running total)
  // To do this accurately: sort dates ascending, compute cumulative spend, then map back
  const ascDates = [...sortedDates].sort((a, b) => a.localeCompare(b));
  const cumulativeMap: Record<string, number> = {};
  let runningSpend = 0;
  for (const d of ascDates) {
    runningSpend += groups[d].totalSpent;
    cumulativeMap[d] = runningSpend;
  }

  return sortedDates.map((dateKey) => {
    const grp = groups[dateKey];
    // Sort transactions within day by createdAt desc
    grp.transactions.sort((a, b) => {
      const timeA = new Date(a.createdAt || a.date).getTime();
      const timeB = new Date(b.createdAt || b.date).getTime();
      return timeB - timeA;
    });

    return {
      date: dateKey,
      formattedDate: formatTransactionDate(dateKey),
      relativeDate: formatRelativeDate(dateKey),
      totalSpent: grp.totalSpent,
      totalIncome: grp.totalIncome,
      netAmount: grp.totalIncome - grp.totalSpent,
      cumulativeMonthSpent: cumulativeMap[dateKey] || grp.totalSpent,
      transactions: grp.transactions,
    };
  });
}

