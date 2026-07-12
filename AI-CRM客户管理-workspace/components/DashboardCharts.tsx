"use client";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

export interface DashboardStats {
  total: number;
  following: number;
  won: number;
  lost: number;
  weekNew: number;
  monthWon: number;
  trend: { date: string; newCount: number; wonCount: number }[];
}

export default function DashboardCharts({ stats }: { stats: DashboardStats }) {
  const pieData = [
    { name: "跟进中", value: stats.following, color: "#0071e3" },
    { name: "已成交", value: stats.won, color: "#2997ff" },
    { name: "流失", value: stats.lost, color: "#e2e2e5" },
  ].filter((d) => d.value > 0);

  return (
    <div className="grid grid-cols-2 gap-5">
      <div className="card p-6">
        <h3 className="mb-4 text-[15px] font-semibold text-carbon">
          客户状态分布
        </h3>
        {stats.total === 0 ? (
          <Empty />
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={85}
                label={({ name, value }) => `${name} ${value}`}
                labelLine={false}
              >
                {pieData.map((d) => (
                  <Cell key={d.name} fill={d.color} stroke="none" />
                ))}
              </Pie>
              <Legend
                wrapperStyle={{ fontSize: 12, color: "#707070" }}
                iconType="circle"
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid #d2d2d7",
                  fontSize: 13,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="card p-6">
        <h3 className="mb-4 text-[15px] font-semibold text-carbon">
          近 7 天新增 / 成交趋势
        </h3>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={stats.trend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f7" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: "#707070" }}
              stroke="#d2d2d7"
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 12, fill: "#707070" }}
              stroke="#d2d2d7"
            />
            <Tooltip
              contentStyle={{
                borderRadius: 8,
                border: "1px solid #d2d2d7",
                fontSize: 13,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12, color: "#707070" }} iconType="circle" />
            <Line
              type="monotone"
              dataKey="newCount"
              name="新增客户"
              stroke="#0071e3"
              strokeWidth={2}
              dot={{ r: 3, fill: "#0071e3" }}
            />
            <Line
              type="monotone"
              dataKey="wonCount"
              name="成交客户"
              stroke="#2997ff"
              strokeWidth={2}
              dot={{ r: 3, fill: "#2997ff" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function Empty() {
  return (
    <div className="flex h-[260px] items-center justify-center text-[14px] text-mist">
      暂无数据
    </div>
  );
}
