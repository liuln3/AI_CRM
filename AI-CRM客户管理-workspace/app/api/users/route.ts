import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getUsers, createUser } from "@/lib/queries";
import type { Role } from "@/lib/types";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }
  const users = getUsers();
  return NextResponse.json({ users });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }
  const { username, password, name, role } = await req.json();
  if (!username || !password || !name) {
    return NextResponse.json({ error: "请填写完整信息" }, { status: 400 });
  }
  if (!["admin", "manager", "sales"].includes(role)) {
    return NextResponse.json({ error: "角色无效" }, { status: 400 });
  }
  try {
    const id = await createUser({
      username: String(username).trim(),
      password: String(password),
      name: String(name).trim(),
      role: role as Role,
    });
    return NextResponse.json({ ok: true, id });
  } catch (e) {
    const msg = (e as Error).message || "";
    if (msg.includes("UNIQUE")) {
      return NextResponse.json({ error: "账号已存在" }, { status: 400 });
    }
    return NextResponse.json({ error: "创建失败" }, { status: 500 });
  }
}
