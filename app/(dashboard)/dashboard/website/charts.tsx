"use client";

import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

interface ChartDataPoint {
  time: string;
  online: number;
  loadTime: number | null;
}

function formatTime(time: unknown) {
  return format(new Date(String(time)), "d MMM HH:mm", { locale: nl });
}

function formatTimeShort(time: string) {
  return format(new Date(time), "d/M", { locale: nl });
}

export function UptimeChart({ data }: { data: ChartDataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis
          dataKey="time"
          tickFormatter={formatTimeShort}
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          domain={[0, 1]}
          ticks={[0, 1]}
          tickFormatter={(v) => (v === 1 ? "Online" : "Offline")}
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          tickLine={false}
          axisLine={false}
          width={50}
        />
        <Tooltip
          labelFormatter={formatTime}
          formatter={(value) => [
            Number(value) === 1 ? "Online" : "Offline",
            "Status",
          ]}
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
            fontSize: "13px",
          }}
        />
        <Area
          type="stepAfter"
          dataKey="online"
          stroke="#22c55e"
          fill="#dcfce7"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function LoadTimeChart({ data }: { data: ChartDataPoint[] }) {
  const filtered = data
    .filter((d) => d.loadTime !== null)
    .map((d) => ({ time: d.time, loadTime: d.loadTime }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={filtered}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis
          dataKey="time"
          tickFormatter={formatTimeShort}
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          tickLine={false}
          axisLine={false}
          width={40}
          tickFormatter={(v) => `${v}s`}
        />
        <Tooltip
          labelFormatter={formatTime}
          formatter={(value) => [`${Number(value).toFixed(2)}s`, "Laadtijd"]}
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
            fontSize: "13px",
          }}
        />
        <Line
          type="monotone"
          dataKey="loadTime"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: "#3b82f6" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
