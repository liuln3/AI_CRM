"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

interface Msg {
  role: "user" | "assistant";
  content: string;
  type?: "report" | "text";
}

function getRecommendations(page: string, label: string) {
  const recs: { text: string; action: string }[] = [];
  if (page === "/" || page === "") {
    recs.push({ text: "我今天的待办有哪些？", action: "todo" });
  } else if (page.startsWith("/leads")) {
    recs.push({ text: "今日待认领线索概况", action: "leads_summary" });
  } else if (page.startsWith("/customers/")) {
    recs.push({
      text: `一键生成「${label || "当前客户"}」的分析报告`,
      action: "report",
    });
    recs.push({ text: "汇总近期跟进要点", action: "followup_summary" });
  } else if (page.startsWith("/customers")) {
    recs.push({ text: "我的客户跟进情况", action: "my_customers" });
  } else if (page.startsWith("/dashboard")) {
    recs.push({ text: "团队本周转化情况", action: "team_conversion" });
  } else if (page.startsWith("/messages")) {
    recs.push({ text: "昨日动态摘要", action: "yesterday_digest" });
  }
  recs.push({ text: "如何用对话录入跟进？", action: "guide_input" });
  return recs;
}

export default function FloatingAgent() {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState("");
  const [objLabel, setObjLabel] = useState("");
  const [objId, setObjId] = useState("");
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "我是你的 AI 销售助手 👋\n可以帮你生成客户分析报告、汇总跟进、解答问题。试试点击下方推荐问题，或在客户详情页让我一键生成报告。",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const readCtx = () => {
      const el = document.querySelector(
        "[data-agent-context]"
      ) as HTMLElement | null;
      if (el) {
        setPage(el.dataset.agentPage || pathname);
        setObjLabel(el.dataset.agentLabel || "");
        setObjId(el.dataset.agentObject || "");
      } else {
        setPage(pathname);
        setObjLabel("");
        setObjId("");
      }
    };
    readCtx();
    const t = setTimeout(readCtx, 200);
    return () => clearTimeout(t);
  }, [pathname]);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages, open]);

  const recommendations = getRecommendations(page, objLabel);

  async function send(text: string, action?: string) {
    if ((!text.trim() && !action) || loading) return;
    setLoading(true);
    const userMsg =
      text.trim() ||
      recommendations.find((r) => r.action === action)?.text ||
      "";
    const newMsgs: Msg[] = [...messages, { role: "user", content: userMsg }];
    setMessages(newMsgs);
    setInput("");
    try {
      const res = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          action,
          page,
          objectId: objId,
          label: objLabel,
        }),
      });
      const data = await res.json();
      setMessages([
        ...newMsgs,
        { role: "assistant", content: data.content, type: data.type },
      ]);
    } catch {
      setMessages([
        ...newMsgs,
        { role: "assistant", content: "请求失败，请稍后重试。" },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-apple text-white transition-colors hover:bg-[#0077ed]"
          aria-label="打开 AI 助手"
        >
          <span className="text-2xl">🤖</span>
        </button>
      )}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 flex h-[540px] w-[380px] flex-col overflow-hidden rounded-lg border border-hairline bg-white">
          {/* header — white surface, hairline bottom rule */}
          <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
            <div className="min-w-0">
              <div className="text-[15px] font-semibold text-carbon">
                AI 销售助手
              </div>
              <div className="text-[12px] text-ash truncate">
                {objLabel ? `当前：${objLabel}` : "上下文：" + (page || "工作台")}
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-2xl leading-none px-1 text-mist hover:text-carbon"
              aria-label="关闭"
            >
              ×
            </button>
          </div>

          {/* messages */}
          <div
            ref={scrollRef}
            className="flex-1 space-y-3 overflow-y-auto bg-frost p-3"
          >
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-[14px] ${
                    m.role === "user"
                      ? "bg-apple text-white"
                      : "border border-hairline bg-white text-carbon"
                  }`}
                >
                  {m.type === "report" ? (
                    <div
                      className="report-md max-w-none text-[13px] leading-relaxed"
                      dangerouslySetInnerHTML={{
                        __html: renderMarkdown(m.content),
                      }}
                    />
                  ) : (
                    <span className="whitespace-pre-wrap">{m.content}</span>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="text-center text-[12px] text-mist">
                AI 思考中…
              </div>
            )}
          </div>

          {/* recommendations — outlined pill chips */}
          {recommendations.length > 0 && (
            <div className="border-t border-hairline bg-white px-3 py-2">
              <div className="mb-1.5 text-[12px] text-mist">推荐问题</div>
              <div className="flex flex-wrap gap-1.5">
                {recommendations.map((r) => (
                  <button
                    key={r.action}
                    onClick={() => send("", r.action)}
                    disabled={loading}
                    className="rounded-full border border-link px-2.5 py-1 text-[12px] font-normal text-link transition-colors hover:bg-ice disabled:opacity-50"
                  >
                    {r.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* input */}
          <div className="flex items-center gap-2 border-t border-hairline bg-white p-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") send(input);
              }}
              placeholder="输入消息…"
              className="flex-1 rounded-lg border border-hairline bg-frost px-3 py-2 text-[14px] text-carbon outline-none transition placeholder:text-mist focus:border-apple focus:bg-white focus:ring-2 focus:ring-apple/20"
            />
            <button
              onClick={() => send(input)}
              disabled={loading || !input.trim()}
              className="rounded-full bg-apple px-4 py-2 text-[14px] font-normal text-white transition-colors hover:bg-[#0077ed] disabled:opacity-40"
            >
              发送
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function renderMarkdown(md: string): string {
  return md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/^### (.*)$/gm, "<h4>$1</h4>")
    .replace(/^## (.*)$/gm, "<h3>$1</h3>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/^> (.*)$/gm, "<blockquote>$1</blockquote>")
    .replace(/^\d+\. (.*)$/gm, "<div>• $1</div>")
    .replace(/^- (.*)$/gm, "<div>• $1</div>")
    .replace(/\n/g, "<br/>");
}
