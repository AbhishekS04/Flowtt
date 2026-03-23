"use client";

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
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
      <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
        <div className="w-24 h-24 bg-purple-500 rounded-full blur-3xl" />
      </div>
      
      <h2 className="text-[10px] font-bold text-text-muted mb-8 tracking-widest uppercase">Daily Spend Density</h2>
      <ResponsiveContainer width="100%" height={240}>
        <RechartsBarChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.8}/>
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.3}/>
            </linearGradient>
          </defs>
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
            fill="url(#barGradient)" 
            radius={[4, 4, 0, 0]} 
            maxBarSize={28} 
            animationDuration={1500}
          />
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}
