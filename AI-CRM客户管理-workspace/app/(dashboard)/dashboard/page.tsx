import { getSession } from "@/lib/auth";
import { getDashboardStats } from "@/lib/queries";
import DashboardCharts from "@/components/DashboardCharts";

export const runtime = "nodejs";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) return null;
  const scope = session.role === "sales" ? "mine" : "all";
  const stats = getDashboardStats(scope, session.id);

  const cards = [
    { label: "客户总数", value: stats.total, icon: "👥" },
    { label: "跟进中", value: stats.following, icon: "🔄" },
    { label: "本周新增", value: stats.weekNew, icon: "📈" },
    { label: "本月成交", value: stats.monthWon, icon: "🎉" },
  ];

  return (
    <div
      data-agent-context
      data-agent-page="/dashboard"
      className="mx-auto max-w-[1440px] space-y-6 px-8 py-10"
    >
      <div>
        <h1
          className="text-[28px] font-semibold leading-[1.18] text-carbon"
          style={{ letterSpacing: "0.196px" }}
        >
          数据看板
        </h1>
        <p className="mt-1 text-[17px] font-light text-ash">
          {scope === "mine" ? "我的客户数据概览" : "团队全部客户数据概览"}
        </p>
      </div>

      <div className="grid grid-cols-4 gap-5">
        {cards.map((c) => (
          <div key={c.label} className="card p-5">
            <div className="flex items-center justify-between">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-frost text-lg">
                {c.icon}
              </span>
              <span
                className="text-[32px] font-semibold leading-none text-carbon"
                style={{ letterSpacing: "-0.022em" }}
              >
                {c.value}
              </span>
            </div>
            <div className="mt-3 text-[13px] text-ash">{c.label}</div>
          </div>
        ))}
      </div>

      <DashboardCharts stats={stats} />
    </div>
  );
}
