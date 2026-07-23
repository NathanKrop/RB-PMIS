"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LabelList,
} from "recharts";

interface BarChartProps {
  data: { name: string; value: number; color?: string }[];
  title?: string;
  color?: string;
  valueLabel?: string;
}

export function SimpleBarChart({ data, title, color = "hsl(240 5.9% 10%)", valueLabel = "Count" }: BarChartProps) {
  if (!data.length || data.every((d) => d.value === 0)) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
        No data yet
      </div>
    );
  }

  return (
    <div className="w-full">
      {title && <p className="text-sm font-medium mb-2">{title}</p>}
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 16, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(240 5.9% 90%)" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            interval={0}
            angle={data.length > 5 ? -30 : 0}
            textAnchor={data.length > 5 ? "end" : "middle"}
            height={data.length > 5 ? 50 : 30}
          />
          <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip
            cursor={{ fill: "hsl(240 4.8% 95.9%)" }}
            formatter={(value) => [value ?? 0, valueLabel]}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={48}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color ?? color} />
            ))}
            <LabelList dataKey="value" position="top" style={{ fontSize: 11 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
