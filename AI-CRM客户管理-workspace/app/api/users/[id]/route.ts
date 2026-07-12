import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getUserById, updateUserRole, deleteUser } from "@/lib/queries";
import type { Role } from "@/lib/types";

export const runtime = "nodejs";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }
  const id = Number(params.id);
  const { role } = await req.json();
  if (!["admin", "manager", "sales"].includes(role)) {
    return NextResponse.json({ error: "角色无效" }, { status: 400 });
  }
  updateUserRole(id, role as Role);
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }
  const id = Number(params.id);
  const user = getUserById(id);
  if (!user) {
    return NextResponse.json({ error: "用户不存在" }, { status: 404 });
  }
  if (user.username === "admin") {
    return NextResponse.json(
      { error: "默认管理员不可删除" },
      { status: 400 }
    );
  }
  deleteUser(id);
  return NextResponse.json({ ok: true });
}
