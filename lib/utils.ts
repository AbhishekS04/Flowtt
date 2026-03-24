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
