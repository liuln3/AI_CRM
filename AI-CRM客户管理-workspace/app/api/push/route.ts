import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getPushConfig, updatePushConfig } from "@/lib/queries";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const config = getPushConfig();
  return NextResponse.json({ config });
}

export async function PUT(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }
  const body = await req.json();
  updatePushConfig({
    push_time: body.push_time,
    roles: body.roles,
    items: body.items,
    enabled: body.enabled,
  });
  return NextResponse.json({ ok: true });
}
