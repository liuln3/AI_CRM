"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const DEMO = [
  { u: "admin", p: "admin123", label: "管理员", desc: "全部功能 / 用户管理 / 推送配置" },
  { u: "manager", p: "manager123", label: "销售主管", desc: "团队数据看板 / 全客户视图" },
  { u: "sales01", p: "sales123", label: "一线销售", desc: "认领线索 / 对话录入 / 我的客户" },
];

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "登录失败");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  }

  function quick(u: string, p: string) {
    setUsername(u);
    setPassword(p);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-frost px-4 py-16">
      {/* Hero — large product name, whisper tagline */}
      <div className="mb-10 text-center">
        <div className="mb-3 text-5xl">🤝</div>
        <h1
          className="text-[56px] font-semibold leading-[1.07] text-carbon"
          style={{ letterSpacing: "0.616px" }}
        >
          AI+CRM 客户管理
        </h1>
        <p
          className="mt-2 text-[21px] font-light text-ash"
          style={{ letterSpacing: "-0.005em" }}
        >
          对话式录入，让销售不再抗拒写 CRM
        </p>
      </div>

      {/* Form card — hairline, no shadow */}
      <form
        onSubmit={submit}
        className="w-full max-w-[400px] space-y-4 rounded-lg border border-hairline bg-white p-6"
      >
        <div>
          <label className="mb-1.5 block text-[12px] font-semibold text-carbon">
            账号
          </label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="请输入账号"
            className="input w-full"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[12px] font-semibold text-carbon">
            密码
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="请输入密码"
            className="input w-full"
          />
        </div>
        {error && (
          <div className="rounded-lg bg-frost px-3 py-2 text-[13px] text-smoke">
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="btn-filled-lg w-full"
        >
          {loading ? "登录中…" : "登录"}
        </button>
      </form>

      {/* Demo accounts — flat, typographic */}
      <div className="mt-6 w-full max-w-[400px] rounded-lg border border-hairline bg-white p-4">
        <div className="mb-2 text-[12px] font-semibold text-carbon">
          演示账号（点击快速填充）
        </div>
        <div className="divide-y divide-hairline">
          {DEMO.map((d) => (
            <button
              key={d.u}
              onClick={() => quick(d.u, d.p)}
              className="flex w-full items-center justify-between py-2 text-left hover:bg-frost -mx-2 px-2 rounded-md transition-colors"
            >
              <div className="text-[13px]">
                <span className="font-semibold text-carbon">{d.label}</span>
                <span className="ml-2 text-ash">
                  {d.u} / {d.p}
                </span>
              </div>
              <span className="text-[12px] text-mist">{d.desc}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
