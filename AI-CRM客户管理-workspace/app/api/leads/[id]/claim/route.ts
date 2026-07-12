import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { claimLead } from "@/lib/queries";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const leadId = Number(params.id);
  if (!leadId) {
    return NextResponse.json({ error: "参数错误" }, { status: 400 });
  }
  try {
    const customerId = claimLead(leadId, session.id);
    return NextResponse.json({ ok: true, customerId });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 400 }
    );
  }
}
