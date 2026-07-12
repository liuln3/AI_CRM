"use client";
import { useEffect, useState } from "react";

interface User {
  id: number;
  username: string;
  name: string;
  role: "admin" | "manager" | "sales";
  created_at: string;
}

const ROLE_LABEL: Record<string, string> = {
  admin: "管理员",
  manager: "销售主管",
  sales: "一线销售",
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    username: "",
    password: "",
    name: "",
    role: "sales",
  });
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/users");
      const d = await res.json();
      setUsers(d.users || []);
    } finally {
      setLoading(false);
    }
  }

  async function addUser(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMsg("");
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (!res.ok) {
        setError(d.error || "添加失败");
        return;
      }
      setMsg(`✅ 已添加用户 ${form.name}`);
      setForm({ username: "", password: "", name: "", role: "sales" });
      load();
    } catch {
      setError("网络错误");
    }
  }

  async function changeRole(id: number, role: string) {
    await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    load();
  }

  async function remove(id: number, name: string) {
    if (!confirm(`确认删除用户「${name}」？此操作不可恢复。`)) return;
    await fetch(`/api/users/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div
      data-agent-context
      data-agent-page="/admin/users"
      className="mx-auto max-w-[1440px] space-y-6 px-8 py-10"
    >
      <div>
        <h1
          className="text-[28px] font-semibold leading-[1.18] text-carbon"
          style={{ letterSpacing: "0.196px" }}
        >
          用户与权限管理
        </h1>
        <p className="mt-1 text-[17px] font-light text-ash">
          管理团队成员和角色
        </p>
      </div>

      <div className="card p-6">
        <h2 className="mb-4 text-[15px] font-semibold text-carbon">
          添加用户
        </h2>
        <form onSubmit={addUser} className="grid grid-cols-4 gap-3">
          <input
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            placeholder="登录账号"
            required
            className="input"
          />
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="姓名"
            required
            className="input"
          />
          <input
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="初始密码"
            required
            type="text"
            className="input"
          />
          <div className="flex gap-2">
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="input flex-1 bg-white"
            >
              <option value="sales">一线销售</option>
              <option value="manager">销售主管</option>
              <option value="admin">管理员</option>
            </select>
            <button type="submit" className="btn-filled">
              添加
            </button>
          </div>
        </form>
        {error && <div className="mt-2 text-[13px] text-smoke">{error}</div>}
        {msg && <div className="mt-2 text-[13px] text-link">{msg}</div>}
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-hairline bg-frost text-[12px] text-ash">
              <th className="px-5 py-3 text-left font-semibold">账号</th>
              <th className="px-5 py-3 text-left font-semibold">姓名</th>
              <th className="px-5 py-3 text-left font-semibold">角色</th>
              <th className="px-5 py-3 text-left font-semibold">创建时间</th>
              <th className="px-5 py-3 text-right font-semibold">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-[14px] text-mist">
                  加载中…
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="transition-colors hover:bg-frost">
                  <td className="px-5 py-3.5 text-[14px] text-graphite">
                    {u.username}
                  </td>
                  <td className="px-5 py-3.5 text-[14px] font-normal text-carbon">
                    {u.name}
                  </td>
                  <td className="px-5 py-3.5">
                    <select
                      value={u.role}
                      onChange={(e) => changeRole(u.id, e.target.value)}
                      className="rounded-lg border border-hairline bg-white px-2 py-1 text-[12px] text-graphite outline-none focus:border-apple focus:ring-2 focus:ring-apple/20"
                    >
                      <option value="sales">一线销售</option>
                      <option value="manager">销售主管</option>
                      <option value="admin">管理员</option>
                    </select>
                  </td>
                  <td className="px-5 py-3.5 text-[12px] text-mist">
                    {u.created_at.slice(0, 10)}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {u.username === "admin" ? (
                      <span className="text-[12px] text-mist">默认管理员</span>
                    ) : (
                      <button
                        onClick={() => remove(u.id, u.name)}
                        className="btn-ghost text-[12px] text-smoke hover:text-carbon"
                      >
                        删除
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
