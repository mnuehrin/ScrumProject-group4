"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

interface CategoryChartProps {
    data: {
        name: string;
        value: number;
        fill: string; // Tailwind hex or hsl value
    }[];
}

export function CategoryChart({ data }: CategoryChartProps) {
    if (data.every((d) => d.value === 0)) {
        return (
            <div className="flex h-[250px] items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
                No data
            </div>
        );
    }

    return (
        <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        stroke="hsl(var(--card))"
                        strokeWidth={2}
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{
                            backgroundColor: "var(--card)",
                            borderColor: "var(--border)",
                            borderRadius: "0.5rem",
                            color: "var(--foreground)",
                            fontSize: "12px",
                        }}
                        itemStyle={{ color: "var(--foreground)" }}
                    />
                </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
                {data.map((entry) => (
                    <div key={entry.name} className="flex items-center gap-1.5 text-xs">
                        <div
                            className="h-3 w-3 rounded-sm"
                            style={{ backgroundColor: entry.fill }}
                        />
                        <span className="text-muted-foreground">{entry.name}</span>
                        <span className="font-medium text-foreground">{entry.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
