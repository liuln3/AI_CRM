import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { markMessageRead } from "@/lib/queries";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  markMessageRead(Number(params.id));
  return NextResponse.json({ ok: true });
}
