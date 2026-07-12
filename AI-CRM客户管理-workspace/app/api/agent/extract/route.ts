import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { extractFollowup } from "@/lib/llm";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const { rawText } = await req.json();
  if (!rawText || typeof rawText !== "string") {
    return NextResponse.json({ error: "请输入跟进内容" }, { status: 400 });
  }
  try {
    const extracted = await extractFollowup(rawText);
    return NextResponse.json({ ok: true, extracted });
  } catch (e) {
    return NextResponse.json(
      { error: "提取失败：" + (e as Error).message },
      { status: 500 }
    );
  }
}
