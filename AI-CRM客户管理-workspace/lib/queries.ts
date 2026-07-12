import "server-only";
import { getDb } from "./db";
import { hashPassword } from "./auth";
import type {
  User,
  Lead,
  Customer,
  Followup,
  PushConfig,
  Message,
  Role,
  IntentLevel,
  FollowStatus,
  ExtractedFields,
} from "./types";

// ---------- 用户 ----------
export function getUsers(): User[] {
  return getDb()
    .prepare(
      "SELECT id, username, name, role, created_at FROM users ORDER BY id"
    )
    .all() as User[];
}

export function getUserById(id: number): User | null {
  return (
    (getDb()
      .prepare(
        "SELECT id, username, name, role, created_at FROM users WHERE id = ?"
      )
      .get(id) as User | undefined) || null
  );
}

export function getUserWithPassword(username: string) {
  return getDb()
    .prepare("SELECT * FROM users WHERE username = ?")
    .get(username) as
    | (User & { password_hash: string })
    | undefined;
}

export async function createUser(data: {
  username: string;
  password: string;
  name: string;
  role: Role;
}): Promise<number> {
  const hash = await hashPassword(data.password);
  const info = getDb()
    .prepare(
      "INSERT INTO users (username, password_hash, name, role) VALUES (?,?,?,?)"
    )
    .run(data.username, hash, data.name, data.role);
  return Number(info.lastInsertRowid);
}

export function updateUserRole(id: number, role: Role) {
  getDb().prepare("UPDATE users SET role = ? WHERE id = ?").run(role, id);
}

export function deleteUser(id: number) {
  getDb().prepare("DELETE FROM users WHERE id = ?").run(id);
}

// ---------- 线索 ----------
export function getPendingLeads(): (Lead & { owner_name?: string })[] {
  return getDb()
    .prepare(
      `SELECT l.*, u.name as owner_name FROM leads l
       LEFT JOIN users u ON l.claimed_by = u.id
       WHERE l.status = 'pending' ORDER BY l.created_at DESC`
    )
    .all() as (Lead & { owner_name?: string })[];
}

export function claimLead(leadId: number, userId: number): number {
  const db = getDb();
  const lead = db
    .prepare("SELECT * FROM leads WHERE id = ? AND status = 'pending'")
    .get(leadId) as Lead | undefined;
  if (!lead) throw new Error("线索不存在或已被认领");

  const tx = db.transaction(() => {
    db.prepare(
      "UPDATE leads SET status = 'claimed', claimed_by = ?, claimed_at = datetime('now') WHERE id = ?"
    ).run(userId, leadId);
    const info = db
      .prepare(
        `INSERT INTO customers (lead_id, owner_id, company, contact_name, contact_phone, intent_level, follow_status, requirement, last_contact_at)
         VALUES (?,?,?,?,?,?,'following',?, datetime('now'))`
      )
      .run(
        lead.id,
        userId,
        lead.company,
        lead.contact_name,
        lead.contact_phone,
        lead.intent_level,
        lead.remark || ""
      );
    return Number(info.lastInsertRowid);
  });
  return tx();
}

// ---------- 客户 ----------
export function getCustomersByOwner(ownerId: number): Customer[] {
  return getDb()
    .prepare("SELECT * FROM customers WHERE owner_id = ? ORDER BY last_contact_at DESC NULLS LAST")
    .all(ownerId) as Customer[];
}

export function getTeamCustomers(): (Customer & { owner_name: string })[] {
  return getDb()
    .prepare(
      `SELECT c.*, u.name as owner_name FROM customers c
       JOIN users u ON c.owner_id = u.id
       ORDER BY c.last_contact_at DESC NULLS LAST`
    )
    .all() as (Customer & { owner_name: string })[];
}

export function getCustomerById(id: number): Customer | null {
  return (
    (getDb()
      .prepare("SELECT * FROM customers WHERE id = ?")
      .get(id) as Customer | undefined) || null
  );
}

export function updateCustomer(
  id: number,
  data: Partial<
    Pick<
      Customer,
      | "company"
      | "contact_name"
      | "contact_phone"
      | "email"
      | "intent_level"
      | "follow_status"
      | "requirement"
    >
  >
) {
  const fields: string[] = [];
  const vals: (string | number)[] = [];
  for (const [k, v] of Object.entries(data)) {
    fields.push(`${k} = ?`);
    vals.push(v as string | number);
  }
  if (fields.length === 0) return;
  vals.push(id);
  getDb()
    .prepare(`UPDATE customers SET ${fields.join(", ")} WHERE id = ?`)
    .run(...vals);
}

// ---------- 跟进 ----------
export function getFollowupsByCustomer(customerId: number): Followup[] {
  return getDb()
    .prepare(
      "SELECT * FROM followups WHERE customer_id = ? ORDER BY created_at DESC"
    )
    .all(customerId) as Followup[];
}

export function addFollowup(
  customerId: number,
  createdBy: number,
  rawInput: string,
  extracted: ExtractedFields
): void {
  const db = getDb();
  const tx = db.transaction(() => {
    const info = db
      .prepare(
        `INSERT INTO followups (customer_id, content, raw_input, extracted, intent_level, follow_status, contact_time, created_by)
         VALUES (?,?,?,?,?,?,?,?)`
      )
      .run(
        customerId,
        extracted.summary || rawInput.slice(0, 200),
        rawInput,
        JSON.stringify(extracted),
        extracted.intent_level || null,
        extracted.follow_status || null,
        new Date().toISOString().slice(0, 19).replace("T", " "),
        createdBy
      );
    // 更新客户最后联系时间 + 状态/意向度
    const updates: string[] = ["last_contact_at = datetime('now')"];
    const vals: (string | number)[] = [];
    if (extracted.intent_level) {
      updates.push("intent_level = ?");
      vals.push(extracted.intent_level);
    }
    if (extracted.follow_status) {
      updates.push("follow_status = ?");
      vals.push(extracted.follow_status);
    }
    if (extracted.company) {
      updates.push("company = ?");
      vals.push(extracted.company);
    }
    if (extracted.contact_name) {
      updates.push("contact_name = ?");
      vals.push(extracted.contact_name);
    }
    if (extracted.contact_phone) {
      updates.push("contact_phone = ?");
      vals.push(extracted.contact_phone);
    }
    if (extracted.requirement) {
      updates.push("requirement = ?");
      vals.push(extracted.requirement);
    }
    vals.push(customerId);
    db.prepare(`UPDATE customers SET ${updates.join(", ")} WHERE id = ?`).run(
      ...vals
    );
    return Number(info.lastInsertRowid);
  });
  tx();
}

// ---------- 看板统计 ----------
export interface DashboardStats {
  total: number;
  following: number;
  won: number;
  lost: number;
  weekNew: number;
  monthWon: number;
  trend: { date: string; newCount: number; wonCount: number }[];
}

export function getDashboardStats(scope: "all" | "mine", userId?: number): DashboardStats {
  const db = getDb();
  const where = scope === "mine" && userId ? `WHERE owner_id = ${userId}` : "";

  const total = (db.prepare(`SELECT COUNT(*) c FROM customers ${where}`).get() as {
    c: number;
  }).c;
  const following = (
    db
      .prepare(
        `SELECT COUNT(*) c FROM customers ${where ? where + " AND" : "WHERE"} follow_status = 'following'`
      )
      .get() as { c: number }
  ).c;
  const won = (
    db
      .prepare(
        `SELECT COUNT(*) c FROM customers ${where ? where + " AND" : "WHERE"} follow_status = 'won'`
      )
      .get() as { c: number }
  ).c;
  const lost = (
    db
      .prepare(
        `SELECT COUNT(*) c FROM customers ${where ? where + " AND" : "WHERE"} follow_status = 'lost'`
      )
      .get() as { c: number }
  ).c;

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
  weekStart.setHours(0, 0, 0, 0);
  const weekNew = (
    db
      .prepare(
        `SELECT COUNT(*) c FROM customers ${where ? where + " AND" : "WHERE"} created_at >= ?`
      )
      .get(weekStart.toISOString().slice(0, 19).replace("T", " ")) as {
      c: number;
    }
  ).c;

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const monthWon = (
    db
      .prepare(
        `SELECT COUNT(*) c FROM customers ${where ? where + " AND" : "WHERE"} follow_status = 'won' AND last_contact_at >= ?`
      )
      .get(monthStart.toISOString().slice(0, 19).replace("T", " ")) as {
      c: number;
    }
  ).c;

  // 近 7 天趋势
  const trend: { date: string; newCount: number; wonCount: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dayStr = d.toISOString().slice(0, 10);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    const nextStr = next.toISOString().slice(0, 19).replace("T", " ");
    const dayStrFull = dayStr + " 00:00:00";
    const newCount = (
      db
        .prepare(
          `SELECT COUNT(*) c FROM customers ${where ? where + " AND" : "WHERE"} created_at >= ? AND created_at < ?`
        )
        .get(dayStrFull, nextStr) as { c: number }
    ).c;
    const wonCount = (
      db
        .prepare(
          `SELECT COUNT(*) c FROM customers ${where ? where + " AND" : "WHERE"} follow_status = 'won' AND last_contact_at >= ? AND last_contact_at < ?`
        )
        .get(dayStrFull, nextStr) as { c: number }
    ).c;
    trend.push({ date: dayStr.slice(5), newCount, wonCount });
  }

  return { total, following, won, lost, weekNew, monthWon, trend };
}

// ---------- 推送配置 ----------
export function getPushConfig(): PushConfig {
  return getDb().prepare("SELECT * FROM push_config WHERE id = 1").get() as PushConfig;
}

export function updatePushConfig(data: {
  push_time?: string;
  roles?: string;
  items?: string;
  enabled?: number;
}) {
  const fields: string[] = ["updated_at = datetime('now')"];
  const vals: (string | number)[] = [];
  for (const [k, v] of Object.entries(data)) {
    fields.push(`${k} = ?`);
    vals.push(v as string | number);
  }
  vals.push(1);
  getDb()
    .prepare(`UPDATE push_config SET ${fields.join(", ")} WHERE id = ?`)
    .run(...vals);
}

// ---------- 消息 ----------
export function getMessagesByUser(userId: number): Message[] {
  return getDb()
    .prepare(
      "SELECT * FROM messages WHERE user_id = ? ORDER BY created_at DESC"
    )
    .all(userId) as Message[];
}

export function markMessageRead(id: number) {
  getDb().prepare("UPDATE messages SET read = 1 WHERE id = ?").run(id);
}

export function createDailyPushForUser(userId: number, content: string) {
  getDb()
    .prepare(
      "INSERT INTO messages (user_id, title, content, type) VALUES (?, '昨日客户动态摘要', ?, 'daily_push')"
    )
    .run(userId, content);
}

/** 生成昨日动态摘要内容 */
export function buildDailyDigest(userId: number, role: Role): string {
  const db = getDb();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yStart = yesterday.toISOString().slice(0, 10) + " 00:00:00";
  const yEnd = yesterday.toISOString().slice(0, 10) + " 23:59:59";

  const ownerFilter =
    role === "sales" ? `AND owner_id = ${userId}` : "";
  const newCustomers = (
    db
      .prepare(
        `SELECT COUNT(*) c FROM customers WHERE created_at >= ? AND created_at <= ? ${ownerFilter}`
      )
      .get(yStart, yEnd) as { c: number }
  ).c;
  const statusChanged = (
    db
      .prepare(
        `SELECT COUNT(*) c FROM followups WHERE created_at >= ? AND created_at <= ? ${
          role === "sales" ? `AND created_by = ${userId}` : ""
        }`
      )
      .get(yStart, yEnd) as { c: number }
  ).c;
  const pending = (
    db
      .prepare(
        `SELECT COUNT(*) c FROM customers WHERE follow_status = 'following' ${
          role === "sales" ? `AND owner_id = ${userId}` : ""
        }`
      )
      .get() as { c: number }
  ).c;
  const highlights = (
    db
      .prepare(
        `SELECT company FROM customers WHERE intent_level = 'high' AND follow_status = 'following' ${
          role === "sales" ? `AND owner_id = ${userId}` : ""
        } LIMIT 3`
      )
      .all() as { company: string }[]
  ).map((r) => r.company);

  const lines: string[] = [];
  lines.push(`昨日新增客户 ${newCustomers} 位；`);
  lines.push(`状态变化 ${statusChanged} 次；`);
  lines.push(`待跟进客户 ${pending} 位；`);
  if (highlights.length)
    lines.push(`重点提醒：${highlights.join("、")} 为高意向待推进客户。`);
  return lines.join("");
}
