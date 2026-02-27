"use client";

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from "recharts";

interface StatusChartProps {
    data: {
        name: string;
        value: number;
        fill: string;
    }[];
}

export function StatusChart({ data }: StatusChartProps) {
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
                <BarChart
                    data={data}
                    margin={{
                        top: 10,
                        right: 10,
                        left: -20,
                        bottom: 0,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: "#94a3b8" }} // slate-400 for dark mode visibility
                        dy={10}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: "#94a3b8" }}
                        allowDecimals={false}
                    />
                    <Tooltip
                        cursor={{ fill: "var(--muted)", opacity: 0.4 }}
                        contentStyle={{
                            backgroundColor: "var(--card)",
                            borderColor: "var(--border)",
                            borderRadius: "0.5rem",
                            color: "var(--foreground)",
                            fontSize: "12px",
                        }}
                        itemStyle={{ color: "var(--foreground)" }}
                    />
                    <Bar dataKey="value" name="Count" radius={[6, 6, 0, 0]} barSize={60}>
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
