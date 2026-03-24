import { useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { getCategoryColor, formatCurrency } from "@/lib/utils";

interface DonutChartProps {
  categoryBreakdown: Record<string, number>;
}

export default function DonutChart({ categoryBreakdown }: DonutChartProps) {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  
  const data = Object.entries(categoryBreakdown)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }));

  const total = data.reduce((acc, curr) => acc + curr.value, 0);
  const hoveredValue = hoveredCategory 
    ? data.find(d => d.name === hoveredCategory)?.value 
    : total;

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
              paddingAngle={6}
              dataKey="value"
              stroke="none"
              cornerRadius={6}
              onMouseEnter={(_, index) => setHoveredCategory(data[index].name)}
              onMouseLeave={() => setHoveredCategory(null)}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={index} 
                  fill={getCategoryColor(entry.name)} 
                  className="outline-none focus:outline-none transition-opacity duration-300 pointer-events-auto"
                  style={{ opacity: hoveredCategory && hoveredCategory !== entry.name ? 0.3 : 1 }}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute flex flex-col items-center pointer-events-none transition-all duration-300">
          <span className="text-[8px] font-bold text-text-muted uppercase tracking-[0.3em] mb-1">
            {hoveredCategory ? hoveredCategory : "Total Spend"}
          </span>
          <span className="text-xl font-bold text-text-primary tracking-tighter">
            {formatCurrency(hoveredValue || 0)}
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
