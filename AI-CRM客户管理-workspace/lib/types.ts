export type Role = "admin" | "manager" | "sales";

export const ROLE_LABEL: Record<Role, string> = {
  admin: "管理员",
  manager: "销售主管",
  sales: "一线销售",
};

export interface User {
  id: number;
  username: string;
  name: string;
  role: Role;
  created_at: string;
}

export type LeadStatus = "pending" | "claimed";
export type IntentLevel = "high" | "medium" | "low";

export const INTENT_LABEL: Record<IntentLevel, string> = {
  high: "高意向",
  medium: "中意向",
  low: "低意向",
};

export interface Lead {
  id: number;
  company: string;
  contact_name: string;
  contact_phone: string;
  source: string;
  intent_level: IntentLevel;
  status: LeadStatus;
  remark?: string | null;
  created_at: string;
  claimed_by?: number | null;
  claimed_at?: string | null;
}

export type FollowStatus = "following" | "won" | "lost";

export const FOLLOW_STATUS_LABEL: Record<FollowStatus, string> = {
  following: "跟进中",
  won: "已成交",
  lost: "流失",
};

export interface Customer {
  id: number;
  lead_id?: number | null;
  owner_id: number;
  company: string;
  contact_name: string;
  contact_phone: string;
  email?: string | null;
  intent_level: IntentLevel;
  follow_status: FollowStatus;
  requirement?: string | null;
  last_contact_at?: string | null;
  created_at: string;
}

export interface Followup {
  id: number;
  customer_id: number;
  content: string;
  raw_input: string;
  extracted: string;
  intent_level?: IntentLevel | null;
  follow_status?: FollowStatus | null;
  contact_time?: string | null;
  created_by: number;
  created_at: string;
}

export interface PushConfig {
  id: number;
  push_time: string;
  roles: string;
  items: string;
  enabled: number;
  updated_at: string;
}

export interface Message {
  id: number;
  user_id: number;
  title: string;
  content: string;
  type: string;
  read: number;
  created_at: string;
}

/** LLM 提取结果 */
export interface ExtractedFields {
  contact_name?: string;
  contact_phone?: string;
  company?: string;
  requirement?: string;
  intent_level?: IntentLevel;
  follow_status?: FollowStatus;
  summary?: string;
}

/** 悬浮 Agent 上下文 */
export interface AgentContext {
  page: string;
  objectId?: number;
  objectType?: string;
  label?: string;
}
