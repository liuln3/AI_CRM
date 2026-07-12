import { NextResponse } from "next/server";
import { getUserWithPassword } from "@/lib/queries";
import { verifyPassword, createToken, setSessionCookie } from "@/lib/auth";
import { seedIfEmpty } from "@/lib/seed";

export const runtime = "nodejs";

export async function POST(req: Request) {
  // 首次访问自动初始化模拟数据
  await seedIfEmpty();

  const { username, password } = await req.json();
  if (!username || !password) {
    return NextResponse.json({ error: "请输入账号和密码" }, { status: 400 });
  }
  const user = getUserWithPassword(username.trim());
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return NextResponse.json({ error: "账号或密码错误" }, { status: 401 });
  }
  const token = await createToken({
    id: user.id,
    username: user.username,
    role: user.role,
  });
  await setSessionCookie(token);
  return NextResponse.json({ ok: true, role: user.role });
}
