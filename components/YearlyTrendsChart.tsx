"use client";

import { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { formatCurrency } from "@/lib/utils";

interface YearlyTrendsChartProps {
  transactions: any[];
}

export default function YearlyTrendsChart({ transactions }: YearlyTrendsChartProps) {
  const chartData = useMemo(() => {
    // Group transactions by month (YYYY-MM)
    const monthlyData: Record<string, { income: number; expense: number }> = {};
    
    // Get last 12 months including current
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthlyData[monthKey] = { income: 0, expense: 0 };
    }

    transactions.forEach(t => {
      const monthKey = t.date.substring(0, 7); // 'YYYY-MM'
      if (monthlyData[monthKey]) {
        if (t.type === "income") {
          monthlyData[monthKey].income += parseFloat(t.amount);
        } else {
          monthlyData[monthKey].expense += parseFloat(t.amount);
        }
      }
    });

    return Object.entries(monthlyData).map(([month, data]) => {
      // Format month key to short string e.g., 'Jan 24'
      const [y, m] = month.split('-');
      const dateObj = new Date(parseInt(y), parseInt(m) - 1, 1);
      const label = dateObj.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      
      return {
        name: label,
        Income: data.income,
        Expense: data.expense,
        Net: data.income - data.expense
      };
    });
  }, [transactions]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border p-4 rounded-xl shadow-2xl">
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-6 mb-1">
               <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                 <span className="text-[10px] uppercase font-bold text-text-muted tracking-widest">{entry.name}</span>
               </div>
               <span className="text-sm font-bold tracking-tighter" style={{ color: entry.color }}>
                 {formatCurrency(entry.value.toString())}
               </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-sm">
      <div className="flex items-center justify-between xl:mb-8 mb-4">
        <h2 className="text-[10px] font-bold text-text-muted tracking-widest uppercase">Income vs Expenses (12 Months)</h2>
      </div>
      <div className="h-[300px] w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.4} />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: "var(--text-muted)", fontWeight: "bold" }} 
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: "var(--text-muted)", fontWeight: "bold" }}
              tickFormatter={(value) => `₹${value}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
               wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 'bold' }}
               iconType="circle"
               iconSize={8}
            />
            <Area 
              type="monotone" 
              dataKey="Income" 
              stroke="#22c55e" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorIncome)" 
            />
            <Area 
              type="monotone" 
              dataKey="Expense" 
              stroke="#ef4444" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorExpense)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
