import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getUsers, buildDailyDigest, createDailyPushForUser } from "@/lib/queries";
import type { Role } from "@/lib/types";

export const runtime = "nodejs";

export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const users = getUsers();
  // 仅对 sales/manager 生成动态
  const targets = users.filter(
    (u) => u.role === "sales" || u.role === "manager"
  );
  let count = 0;
  for (const u of targets) {
    const content = buildDailyDigest(u.id, u.role as Role);
    createDailyPushForUser(u.id, content);
    count++;
  }
  return NextResponse.json({ ok: true, count });
}
