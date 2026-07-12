import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { addFollowup, getCustomerById } from "@/lib/queries";
import type { ExtractedFields } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const { customerId, rawText, extracted } = await req.json();
  if (!customerId || !rawText || !extracted) {
    return NextResponse.json({ error: "参数缺失" }, { status: 400 });
  }
  const customer = getCustomerById(Number(customerId));
  if (!customer) {
    return NextResponse.json({ error: "客户不存在" }, { status: 404 });
  }
  // 权限：销售只能给自己的客户录入
  if (session.role === "sales" && customer.owner_id !== session.id) {
    return NextResponse.json({ error: "无权操作此客户" }, { status: 403 });
  }
  try {
    addFollowup(
      Number(customerId),
      session.id,
      rawText,
      extracted as ExtractedFields
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: "保存失败：" + (e as Error).message },
      { status: 500 }
    );
  }
}
