"use client";

import { CreditCard, TrendingUp } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { formatAdminCurrency } from "@/lib/admin-format";
import type { FinancialStats, PaymentTrend } from "./types";

type FinancialOverviewProps = {
  stats: FinancialStats;
  trend: PaymentTrend[];
};

export function FinancialOverview({ stats, trend }: FinancialOverviewProps) {
  const collectionRate = stats.expected > 0 ? (stats.collected / stats.expected) * 100 : 0;

  return (
    <section className="rounded-xl border border-sage-border bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-6 flex items-start justify-between gap-4 border-b border-sage-border pb-4">
        <div className="flex gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sage-red-50 text-sage-primary">
            <CreditCard className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-lg font-bold text-sage-secondary">Financial overview</h3>
            <p className="mt-1 text-xs text-sage-gray-500">
              Payments collected this month and the six-month trend.
            </p>
          </div>
        </div>
        <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-600 ring-1 ring-green-100">
          Collection rate: {collectionRate.toFixed(1)}%
        </span>
      </div>

      {/* Grid of metrics */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-sage-red-50/20 p-4 border border-sage-border/50">
          <p className="text-xs font-semibold text-sage-gray-500">Expected this month</p>
          <p className="mt-2 text-2xl font-black text-sage-secondary">
            {formatAdminCurrency(stats.expected)}
          </p>
        </div>
        <div className="rounded-xl bg-green-50/20 p-4 border border-green-100/50">
          <p className="text-xs font-semibold text-green-600">Collected this month</p>
          <p className="mt-2 text-2xl font-black text-green-700">
            {formatAdminCurrency(stats.collected)}
          </p>
        </div>
        <div className="rounded-xl bg-orange-50/20 p-4 border border-orange-100/50">
          <p className="text-xs font-semibold text-orange-600">Total due</p>
          <p className="mt-2 text-2xl font-black text-orange-700">
            {formatAdminCurrency(stats.due)}
          </p>
        </div>
      </div>

      {/* Graphical Progress Bar */}
      <div className="mt-5">
        <div className="flex justify-between text-xs font-bold text-sage-gray-500 mb-1">
          <span>Collection progress</span>
          <span>{collectionRate.toFixed(0)}%</span>
        </div>
        <div className="h-3 w-full bg-sage-border/50 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all duration-500 rounded-full"
            style={{ width: `${Math.min(100, collectionRate)}%` }}
          />
        </div>
      </div>

      {/* Recharts chart */}
      <div className="mt-8 border-t border-sage-border pt-6">
        <div className="mb-4 flex items-center gap-2 text-sm font-bold text-sage-secondary">
          <TrendingUp className="h-4 w-4 text-sage-primary" />
          Six-month collection trend (BDT)
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={trend}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis
                dataKey="label"
                tick={{ fill: "#6B7280", fontSize: 11, fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#6B7280", fontSize: 11, fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(val) => `BDT ${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E5E7EB",
                  borderRadius: "8px",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
                  fontFamily: "inherit",
                }}
                formatter={(value: unknown) => [formatAdminCurrency(Number(value)), ""]}
              />
              <Legend
                verticalAlign="top"
                height={36}
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 12, fontWeight: 600, color: "#374151" }}
              />
              <Bar
                name="Expected"
                dataKey="expected"
                fill="#E5E7EB"
                radius={[4, 4, 0, 0]}
                maxBarSize={32}
              />
              <Bar
                name="Collected"
                dataKey="collected"
                fill="#881337" // tailwind rose-900 or similar deep maroon to match sage theme
                radius={[4, 4, 0, 0]}
                maxBarSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
