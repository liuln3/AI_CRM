"use client";
import { useEffect, useState } from "react";

interface Message {
  id: number;
  title: string;
  content: string;
  type: string;
  read: number;
  created_at: string;
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/messages");
      const d = await res.json();
      setMessages(d.messages || []);
    } finally {
      setLoading(false);
    }
  }

  async function markRead(id: number) {
    await fetch(`/api/messages/${id}/read`, { method: "POST" });
    load();
  }

  async function markAllRead() {
    for (const m of messages.filter((m) => !m.read)) {
      await fetch(`/api/messages/${m.id}/read`, { method: "POST" });
    }
    load();
  }

  async function trigger() {
    setTriggering(true);
    setMsg("");
    try {
      const res = await fetch("/api/push/trigger", { method: "POST" });
      const d = await res.json();
      setMsg(d.ok ? `✅ 已为 ${d.count} 位用户生成昨日动态` : "触发失败");
      load();
    } finally {
      setTriggering(false);
    }
  }

  const unread = messages.filter((m) => !m.read).length;

  return (
    <div
      data-agent-context
      data-agent-page="/messages"
      className="mx-auto max-w-3xl px-8 py-10"
    >
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1
            className="text-[28px] font-semibold leading-[1.18] text-carbon"
            style={{ letterSpacing: "0.196px" }}
          >
            站内消息
          </h1>
          <p className="mt-1 text-[17px] font-light text-ash">
            每日客户动态摘要与系统通知{unread > 0 ? `（${unread} 条未读）` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          {unread > 0 && (
            <button onClick={markAllRead} className="btn-outlined">
              全部已读
            </button>
          )}
          <button onClick={trigger} disabled={triggering} className="btn-filled">
            {triggering ? "生成中…" : "生成昨日动态"}
          </button>
        </div>
      </div>

      {msg && <div className="mb-4 text-[13px] text-link">{msg}</div>}

      <div className="card divide-y divide-hairline">
        {loading ? (
          <div className="py-16 text-center text-[14px] text-mist">
            加载中…
          </div>
        ) : messages.length === 0 ? (
          <div className="py-16 text-center text-[14px] text-mist">
            暂无消息，点击「生成昨日动态」体验推送效果
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {!m.read && (
                      <span className="inline-block h-2 w-2 flex-shrink-0 rounded-full bg-apple" />
                    )}
                    <span
                      className={`text-[15px] ${
                        m.read ? "font-normal text-graphite" : "font-semibold text-carbon"
                      }`}
                    >
                      {m.title}
                    </span>
                  </div>
                  <p className="mt-1.5 whitespace-pre-wrap text-[14px] leading-relaxed text-graphite">
                    {m.content}
                  </p>
                  <div className="mt-2 text-[12px] text-mist">
                    {m.created_at.slice(0, 16)}
                  </div>
                </div>
                {!m.read && (
                  <button
                    onClick={() => markRead(m.id)}
                    className="btn-ghost flex-shrink-0 text-[12px]"
                  >
                    标记已读
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
