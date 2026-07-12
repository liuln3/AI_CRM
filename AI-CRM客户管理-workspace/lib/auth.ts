import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { getDb } from "./db";
import type { Role, User } from "./types";

const TOKEN_COOKIE = "ai_crm_token";
const secret = () =>
  new TextEncoder().encode(
    process.env.JWT_SECRET || "ai-crm-mvp-demo-secret-2026"
  );

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(
  plain: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function createToken(user: {
  id: number;
  username: string;
  role: Role;
}): Promise<string> {
  return new SignJWT({
    id: user.id,
    username: user.username,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(secret());
}

export async function verifyToken(token: string): Promise<{
  id: number;
  username: string;
  role: Role;
} | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    return {
      id: Number(payload.id),
      username: payload.username as string,
      role: payload.role as Role,
    };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<{
  id: number;
  username: string;
  role: Role;
} | null> {
  const store = await cookies();
  const token = store.get(TOKEN_COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function setSessionCookie(token: string) {
  const store = await cookies();
  store.set(TOKEN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(TOKEN_COOKIE);
}

export function requireRole(
  session: { role: Role } | null,
  ...roles: Role[]
): void {
  if (!session || !roles.includes(session.role)) {
    throw new Error("无权限访问");
  }
}

export function getCurrentUser(): User | null {
  // 同步读取当前用户（用于 API route 内），基于已验证的 session id
  return null; // 实际用 getSession，这里保留类型占位
}
