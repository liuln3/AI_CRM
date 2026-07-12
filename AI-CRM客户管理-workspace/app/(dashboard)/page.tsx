import { getSession } from "@/lib/auth";
import {
  getPendingLeads,
  getCustomersByOwner,
  getTeamCustomers,
  getMessagesByUser,
} from "@/lib/queries";
import Link from "next/link";
import { INTENT_LABEL } from "@/lib/types";

export const runtime = "nodejs";

export default async function HomePage() {
  const session = await getSession();
  if (!session) return null;
  const isSales = session.role === "sales";
  const leads = getPendingLeads();
  const customers = isSales
    ? getCustomersByOwner(session.id)
    : getTeamCustomers();
  const messages = getMessagesByUser(session.id);
  const unread = messages.filter((m) => !m.read).length;
  const today = new Date().toLocaleDateString("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  const keyCustomers = customers
    .filter((c) => c.follow_status === "following" && c.intent_level === "high")
    .slice(0, 5);

  const stats = [
    { label: "待认领线索", value: leads.length, icon: "🎯", href: "/leads" },
    {
      label: isSales ? "我的客户" : "团队客户",
      value: customers.length,
      icon: "👥",
      href: "/customers",
    },
    {
      label: "高意向待推进",
      value: keyCustomers.length,
      icon: "🔥",
      href: "/customers",
    },
    { label: "未读消息", value: unread, icon: "🔔", href: "/messages" },
  ];

  const shortcuts = [
    { href: "/leads", label: "去认领线索", icon: "🎯", desc: "从线索池领取新客户" },
    { href: "/customers", label: "录入跟进", icon: "💬", desc: "用对话快速记录客户进展" },
    { href: "/dashboard", label: "数据看板", icon: "📊", desc: "查看转化与趋势" },
  ];

  return (
    <div data-agent-context data-agent-page="/" className="mx-auto max-w-[1440px] px-8 py-10">
      {/* Hero header — large name, whisper date */}
      <div className="mb-8">
        <h1
          className="text-[28px] font-semibold leading-[1.18] text-carbon"
          style={{ letterSpacing: "0.196px" }}
        >
          {session.role === "sales" ? "开始今天的工作" : "团队概览"}
        </h1>
        <p className="mt-1 text-[17px] font-light text-ash">{today}</p>
      </div>

      {/* Stat cards — hairline, no shadow, surface shift */}
      <div className="mb-6 grid grid-cols-4 gap-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="card p-5 transition-colors hover:bg-ice"
          >
            <div className="flex items-center justify-between">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-frost text-lg">
                {s.icon}
              </span>
              <span
                className="text-[32px] font-semibold leading-none text-carbon"
                style={{ letterSpacing: "-0.022em" }}
              >
                {s.value}
              </span>
            </div>
            <div className="mt-3 text-[13px] text-ash">{s.label}</div>
          </Link>
        ))}
      </div>

      {/* Shortcuts — typographic CTA tiles */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        {shortcuts.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="card p-5 transition-colors hover:bg-ice"
          >
            <div className="mb-2 text-2xl">{s.icon}</div>
            <div className="text-[15px] font-semibold text-carbon">
              {s.label}
            </div>
            <div className="mt-0.5 text-[12px] text-mist">{s.desc}</div>
          </Link>
        ))}
      </div>

      {/* Key customers — flat list on white surface */}
      <div className="card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[17px] font-semibold text-carbon">
            高意向待推进客户
          </h2>
          <Link href="/customers" className="btn-ghost text-[13px]">
            查看全部 →
          </Link>
        </div>
        {keyCustomers.length === 0 ? (
          <div className="py-8 text-center text-[14px] text-mist">
            暂无高意向待推进客户
          </div>
        ) : (
          <div className="divide-y divide-hairline">
            {keyCustomers.map((c) => (
              <Link
                key={c.id}
                href={`/customers/${c.id}`}
                className="flex items-center justify-between rounded-lg px-2 py-2.5 transition-colors hover:bg-frost"
              >
                <div>
                  <span className="text-[14px] font-normal text-carbon">
                    {c.company}
                  </span>
                  <span className="ml-2 text-[12px] text-mist">
                    {c.contact_name}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[12px] text-mist">
                    最后联系：
                    {c.last_contact_at
                      ? c.last_contact_at.slice(0, 10)
                      : "—"}
                  </span>
                  <span className="tag bg-ice text-carbon">
                    <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-signal" />
                    {INTENT_LABEL[c.intent_level]}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
