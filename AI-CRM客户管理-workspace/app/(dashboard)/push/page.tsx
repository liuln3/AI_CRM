"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const ROLE_OPTIONS = [
  { value: "sales", label: "一线销售" },
  { value: "manager", label: "销售主管" },
];
const ITEM_OPTIONS = [
  { value: "new", label: "新增客户" },
  { value: "status", label: "状态变化" },
  { value: "pending", label: "待跟进客户" },
  { value: "highlight", label: "重点提醒" },
];

export default function PushConfigPage() {
  const [config, setConfig] = useState({
    push_time: "09:00",
    roles: "sales,manager",
    items: "new,status,pending,highlight",
    enabled: 1,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [msg, setMsg] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetch("/api/push")
      .then((r) => r.json())
      .then((d) => {
        if (d.config) setConfig(d.config);
      })
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch("/api/push", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const d = await res.json();
      setMsg(d.ok ? "✅ 配置已保存" : "保存失败");
      if (d.ok) router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function trigger() {
    setTriggering(true);
    setMsg("");
    try {
      const res = await fetch("/api/push/trigger", { method: "POST" });
      const d = await res.json();
      setMsg(d.ok ? `✅ 已为 ${d.count} 位用户生成昨日动态消息` : "触发失败");
      if (d.ok) router.refresh();
    } finally {
      setTriggering(false);
    }
  }

  function toggle(field: "roles" | "items", value: string) {
    const arr = config[field].split(",").filter(Boolean);
    const idx = arr.indexOf(value);
    if (idx >= 0) arr.splice(idx, 1);
    else arr.push(value);
    setConfig({ ...config, [field]: arr.join(",") });
  }

  if (loading) return <div className="px-8 py-10 text-mist">加载中…</div>;

  return (
    <div
      data-agent-context
      data-agent-page="/push"
      className="mx-auto max-w-2xl space-y-5 px-8 py-10"
    >
      <div>
        <h1
          className="text-[28px] font-semibold leading-[1.18] text-carbon"
          style={{ letterSpacing: "0.196px" }}
        >
          每日推送配置
        </h1>
        <p className="mt-1 text-[17px] font-light text-ash">
          配置每日客户动态摘要的推送时间和内容（站内消息）
        </p>
      </div>

      <div className="card space-y-6 p-6">
        <div className="flex items-center justify-between">
          <label className="text-[15px] font-semibold text-carbon">
            启用每日推送
          </label>
          <button
            onClick={() =>
              setConfig({ ...config, enabled: config.enabled ? 0 : 1 })
            }
            className={`relative h-6 w-11 rounded-full transition-colors ${
              config.enabled ? "bg-apple" : "bg-pebble"
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
                config.enabled ? "left-[22px]" : "left-0.5"
              }`}
            />
          </button>
        </div>

        <div>
          <label className="mb-1.5 block text-[13px] font-semibold text-carbon">
            推送时间
          </label>
          <input
            type="time"
            value={config.push_time}
            onChange={(e) =>
              setConfig({ ...config, push_time: e.target.value })
            }
            className="input w-40"
          />
          <span className="ml-2 text-[12px] text-mist">
            每天在此时间生成昨日动态消息
          </span>
        </div>

        <div>
          <label className="mb-2 block text-[13px] font-semibold text-carbon">
            推送角色
          </label>
          <div className="flex gap-2">
            {ROLE_OPTIONS.map((r) => {
              const checked = config.roles.split(",").includes(r.value);
              return (
                <button
                  key={r.value}
                  onClick={() => toggle("roles", r.value)}
                  className={`rounded-full border px-3 py-1.5 text-[14px] transition-colors ${
                    checked
                      ? "border-apple bg-apple text-white"
                      : "border-hairline text-graphite hover:bg-frost"
                  }`}
                >
                  {checked ? "✓ " : ""}
                  {r.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-[13px] font-semibold text-carbon">
            推送内容项
          </label>
          <div className="flex flex-wrap gap-2">
            {ITEM_OPTIONS.map((r) => {
              const checked = config.items.split(",").includes(r.value);
              return (
                <button
                  key={r.value}
                  onClick={() => toggle("items", r.value)}
                  className={`rounded-full border px-3 py-1.5 text-[14px] transition-colors ${
                    checked
                      ? "border-apple bg-apple text-white"
                      : "border-hairline text-graphite hover:bg-frost"
                  }`}
                >
                  {checked ? "✓ " : ""}
                  {r.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex gap-2 border-t border-hairline pt-4">
          <button onClick={save} disabled={saving} className="btn-filled">
            {saving ? "保存中…" : "保存配置"}
          </button>
          <button
            onClick={trigger}
            disabled={triggering}
            className="btn-outlined"
          >
            {triggering ? "生成中…" : "立即生成昨日动态"}
          </button>
        </div>
        {msg && <div className="text-[13px] text-link">{msg}</div>}
      </div>

      <div className="rounded-lg bg-ice p-4 text-[12px] leading-relaxed text-graphite">
        💡 说明：MVP 阶段推送渠道为站内消息（左侧「站内消息」可查看）。
        「立即生成」会为选中角色的每位用户生成一条昨日客户动态摘要，用于演示效果。
      </div>
    </div>
  );
}
