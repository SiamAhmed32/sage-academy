"use client";

import { GraduationCap, Users } from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import type { Demographics } from "./types";

type StudentDistributionProps = {
  demographics: Demographics;
};

export function StudentDistribution({ demographics }: StudentDistributionProps) {
  const { versionDistribution, classDistribution } = demographics;

  // Map version distribution for PieChart
  const versionData = [
    { name: "বাংলা ভার্সন", value: versionDistribution.bangla, color: "#881337" }, // Sage primary maroon
    { name: "ইংলিশ ভার্সন", value: versionDistribution.english, color: "#F59E0B" }, // Amber
    { name: "অন্যান্য", value: versionDistribution.other, color: "#9CA3AF" }, // Gray
  ].filter((item) => item.value > 0);

  const totalVersionCount = versionData.reduce((acc, curr) => acc + curr.value, 0);

  // Map class distribution to user-friendly label
  const classData = classDistribution.map((item) => ({
    name: `${item.classLevel} শ্রেণি`,
    count: item.count,
  }));

  return (
    <section className="rounded-xl border border-sage-border bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-6 flex items-center gap-3 border-b border-sage-border pb-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sage-red-50 text-sage-primary">
          <Users className="h-5 w-5" />
        </span>
        <div>
          <h3 className="text-lg font-bold text-sage-secondary">শিক্ষার্থী ডেমোগ্রাফিক্স</h3>
          <p className="mt-1 text-xs text-sage-gray-500">
            ভার্সন ও শ্রেণিভিত্তিক শিক্ষার্থীর সংখ্যা ও অনুপাত।
          </p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_1.5fr]">
        {/* Left Side: Version Pie Chart */}
        <div className="flex flex-col items-center border-b border-sage-border pb-6 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-6">
          <h4 className="mb-4 text-sm font-bold text-sage-secondary self-start flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-sage-primary" />
            ভার্সন অনুপাত
          </h4>

          {totalVersionCount > 0 ? (
            <div className="relative flex h-48 w-full items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={versionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {versionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#FFFFFF",
                      border: "1px solid #E5E7EB",
                      borderRadius: "8px",
                      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
                      fontFamily: "inherit",
                    }}
                    formatter={(value: any) => [`${value} জন`, ""]}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Central Text */}
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-sage-secondary">
                  {totalVersionCount}
                </span>
                <span className="text-[10px] font-bold text-sage-gray-500">সক্রিয় মোট</span>
              </div>
            </div>
          ) : (
            <div className="flex h-48 w-full items-center justify-center text-sm text-sage-gray-500">
              কোনো তথ্য পাওয়া যায়নি।
            </div>
          )}

          {/* Custom Legend to show details */}
          <div className="mt-4 w-full space-y-2">
            {versionData.map((item, index) => {
              const pct = totalVersionCount > 0 ? (item.value / totalVersionCount) * 100 : 0;
              return (
                <div key={index} className="flex items-center justify-between text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sage-gray-600">{item.name}</span>
                  </div>
                  <span className="text-sage-secondary">
                    {item.value} জন ({pct.toFixed(0)}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Class Distribution Bar Chart */}
        <div className="flex flex-col">
          <h4 className="mb-4 text-sm font-bold text-sage-secondary flex items-center gap-2">
            <Users className="h-4 w-4 text-sage-primary" />
            শ্রেণিভিত্তিক শিক্ষার্থী বন্টন
          </h4>

          {classData.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={classData}
                  layout="vertical"
                  margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                  <XAxis
                    type="number"
                    tick={{ fill: "#6B7280", fontSize: 11, fontWeight: 500 }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fill: "#6B7280", fontSize: 11, fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                    width={70}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#FFFFFF",
                      border: "1px solid #E5E7EB",
                      borderRadius: "8px",
                      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
                      fontFamily: "inherit",
                    }}
                    formatter={(value: any) => [`${value} জন শিক্ষার্থী`, ""]}
                  />
                  <Bar
                    dataKey="count"
                    fill="#F59E0B"
                    radius={[0, 4, 4, 0]}
                    maxBarSize={20}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-64 w-full items-center justify-center text-sm text-sage-gray-500">
              কোনো তথ্য পাওয়া যায়নি।
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
