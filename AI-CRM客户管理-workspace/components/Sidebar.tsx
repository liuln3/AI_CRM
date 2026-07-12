"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { Role } from "@/lib/types";
import { ROLE_LABEL } from "@/lib/types";

const MENUS: { key: string; href: string; label: string; icon: string; roles: Role[] }[] = [
  { key: "home", href: "/", label: "工作台", icon: "🏠", roles: ["admin", "manager", "sales"] },
  { key: "leads", href: "/leads", label: "线索池", icon: "🎯", roles: ["admin", "manager", "sales"] },
  { key: "customers", href: "/customers", label: "我的客户", icon: "👥", roles: ["admin", "manager", "sales"] },
  { key: "dashboard", href: "/dashboard", label: "数据看板", icon: "📊", roles: ["admin", "manager", "sales"] },
  { key: "messages", href: "/messages", label: "站内消息", icon: "🔔", roles: ["admin", "manager", "sales"] },
  { key: "push", href: "/push", label: "推送配置", icon: "⏰", roles: ["admin"] },
  { key: "users", href: "/admin/users", label: "用户管理", icon: "⚙️", roles: ["admin"] },
];

export default function Sidebar({
  role,
  userName,
}: {
  role: Role;
  userName: string;
}) {
  const pathname = usePathname();
  const [loggingOut, setLoggingOut] = useState(false);
  const menus = MENUS.filter((m) => m.roles.includes(role));

  async function logout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <aside className="flex w-56 flex-shrink-0 flex-col border-r border-hairline bg-white">
      <div className="flex items-center gap-2 border-b border-hairline px-5 py-4">
        <span className="text-xl">🤝</span>
        <div>
          <div className="text-[14px] font-semibold text-carbon">AI+CRM</div>
          <div className="text-[11px] text-mist">客户管理 MVP</div>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
        {menus.map((m) => {
          const active =
            m.href === "/" ? pathname === "/" : pathname.startsWith(m.href);
          return (
            <Link
              key={m.key}
              href={m.href}
              className={`flex items-center gap-2 rounded-full px-3 py-2 text-[14px] transition-colors ${
                active
                  ? "bg-apple font-normal text-white"
                  : "text-graphite hover:bg-frost"
              }`}
            >
              <span>{m.icon}</span>
              <span>{m.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-hairline px-3 py-3">
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-frost text-[13px] font-semibold text-carbon">
            {userName.slice(0, 1)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[14px] font-normal text-carbon">
              {userName}
            </div>
            <div className="text-[11px] text-ash">{ROLE_LABEL[role]}</div>
          </div>
        </div>
        <button
          onClick={logout}
          disabled={loggingOut}
          className="mt-2 w-full rounded-full px-3 py-1.5 text-[12px] text-ash transition-colors hover:bg-frost hover:text-carbon"
        >
          {loggingOut ? "退出中…" : "退出登录"}
        </button>
      </div>
    </aside>
  );
}
