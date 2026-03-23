"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { getCategoryColor, formatCurrency } from "@/lib/utils";

interface DonutChartProps {
  categoryBreakdown: Record<string, number>;
}

export default function DonutChart({ categoryBreakdown }: DonutChartProps) {
  const data = Object.entries(categoryBreakdown)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }));

  if (data.length === 0) {
    return (
      <div className="bg-card border border-border p-6 flex flex-col items-center justify-center h-72 shadow-sm">
        <p className="text-text-muted text-xs tracking-widest uppercase font-bold">No Data</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border p-6 sm:p-8 shadow-sm group hover:border-text-muted transition-colors relative">
      <h2 className="text-[10px] font-bold text-text-muted mb-8 tracking-widest uppercase">Spending Categorization</h2>
      <div className="relative flex items-center justify-center">
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={75}
              outerRadius={95}
              paddingAngle={4}
              dataKey="value"
              stroke="none"
              cornerRadius={4}
            >
              {data.map((entry, index) => (
                <Cell key={index} fill={getCategoryColor(entry.name)} />
              ))}
            </Pie>
            <Tooltip
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
              formatter={(value: number) => [formatCurrency(value), ""]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute flex flex-col items-center pointer-events-none">
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">Total</span>
          <span className="text-lg font-bold text-text-primary tracking-tighter">
            {formatCurrency(data.reduce((acc, curr) => acc + curr.value, 0))}
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-2 mt-6 pt-6 border-t border-border">
        {data.map((entry) => (
          <div key={entry.name} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span
                className="inline-block w-2.5 h-2.5 rounded-none"
                style={{ backgroundColor: getCategoryColor(entry.name) }}
              />
              <span className="text-[11px] font-bold text-text-primary uppercase tracking-wider">{entry.name}</span>
            </div>
            <span className="text-[11px] font-mono text-text-primary">{formatCurrency(entry.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
