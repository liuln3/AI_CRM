import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getCustomerById, updateCustomer } from "@/lib/queries";
import type { IntentLevel, FollowStatus } from "@/lib/types";

export const runtime = "nodejs";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const id = Number(params.id);
  const customer = getCustomerById(id);
  if (!customer) {
    return NextResponse.json({ error: "客户不存在" }, { status: 404 });
  }
  if (session.role === "sales" && customer.owner_id !== session.id) {
    return NextResponse.json({ error: "无权操作" }, { status: 403 });
  }
  const body = await req.json();
  const allowed: Record<string, unknown> = {};
  for (const k of [
    "company",
    "contact_name",
    "contact_phone",
    "email",
    "requirement",
  ]) {
    if (typeof body[k] === "string") allowed[k] = body[k];
  }
  if (["high", "medium", "low"].includes(body.intent_level)) {
    allowed.intent_level = body.intent_level as IntentLevel;
  }
  if (["following", "won", "lost"].includes(body.follow_status)) {
    allowed.follow_status = body.follow_status as FollowStatus;
  }
  updateCustomer(id, allowed);
  return NextResponse.json({ ok: true });
}
