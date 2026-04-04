"use client";

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";
import { formatCurrency, getDaysInMonth, getMonthString } from "@/lib/utils";

interface DailyBarChartProps {
  dailyTotals: Record<string, number>;
  month?: string;
}

export default function DailyBarChart({ dailyTotals, month }: DailyBarChartProps) {
  const currentMonth = month ?? getMonthString();
  const [year, mon] = currentMonth.split("-").map(Number);
  const daysInMonth = getDaysInMonth(currentMonth);

  const maxAmount = Math.max(...Object.values(dailyTotals), 0);
  const getBarColor = (amount: number) => {
    if (maxAmount === 0 || amount === 0) return "#4ade80"; // Light green
    const ratio = amount / maxAmount;
    if (ratio <= 0.15) return "#4ade80"; // Light green
    if (ratio <= 0.35) return "#16a34a"; // Deep green
    if (ratio <= 0.55) return "#eab308"; // Yellow
    if (ratio <= 0.75) return "#f97316"; // Orange
    if (ratio <= 0.90) return "#ef4444"; // Light red
    return "#b91c1c"; // Deep red
  };

  const data = Array.from({ length: daysInMonth }, (_, i) => {
    const day = String(i + 1).padStart(2, "0");
    const dateKey = `${year}-${String(mon).padStart(2, "0")}-${day}`;
    return { day: i + 1, amount: dailyTotals[dateKey] ?? 0 };
  }).filter((d) => d.amount > 0);

  if (data.length === 0) {
    return (
      <div className="bg-card border border-border p-6 flex flex-col items-center justify-center h-72 shadow-sm">
        <p className="text-text-muted text-xs tracking-widest uppercase font-bold">No Data</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border p-6 sm:p-8 shadow-sm group hover:border-text-muted transition-colors relative overflow-hidden">
      <div className="flex items-center gap-3 mb-8">
        <span className="w-1 h-3 bg-text-primary rounded-full transition-transform group-hover:scale-y-125 duration-500" />
        <h2 className="text-[10px] font-bold text-text-primary tracking-[0.2em] uppercase">Daily Spend Density</h2>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <RechartsBarChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
          <XAxis
            dataKey="day"
            tick={{ fill: "#666666", fontSize: 10, fontWeight: 700 }}
            axisLine={{ stroke: "#1f1f1f", strokeWidth: 1 }}
            tickLine={false}
            tickMargin={12}
          />
          <YAxis
            tick={{ fill: "#666666", fontSize: 10, fontWeight: 700 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `₹${v}`}
            tickMargin={12}
          />
          <Tooltip
            cursor={{ fill: "rgba(255, 255, 255, 0.05)", radius: 4 }}
            contentStyle={{
              background: "rgba(0, 0, 0, 0.9)",
              backdropFilter: "blur(12px)",
              border: "1px solid #333333",
              borderRadius: "12px",
              color: "#ffffff",
              boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
              padding: "10px 14px",
            }}
            itemStyle={{ color: "#ffffff", fontWeight: 700, fontSize: "12px" }}
            labelStyle={{ color: "#888888", marginBottom: "4px", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" }}
            formatter={(value: number) => [formatCurrency(value), "Spent"]}
            labelFormatter={(label) => `Day ${label}`}
          />
          <Bar 
            dataKey="amount" 
            radius={[4, 4, 0, 0]} 
            maxBarSize={28} 
            animationDuration={1500}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.amount)} />
            ))}
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}


