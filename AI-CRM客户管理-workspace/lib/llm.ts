import OpenAI from "openai";
import type {
  ExtractedFields,
  Customer,
  Followup,
  IntentLevel,
  FollowStatus,
} from "./types";

function getClient(): OpenAI | null {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) return null;
  return new OpenAI({
    apiKey: key,
    baseURL: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com",
  });
}

export function isLlmEnabled(): boolean {
  return !!process.env.DEEPSEEK_API_KEY;
}

const EXTRACT_SYSTEM = `你是一个 CRM 跟进信息提取助手。用户会粘贴聊天记录、客户备注或会议纪要。请从中提取结构化信息，严格返回 JSON，不要任何多余文字。
JSON 字段：
- contact_name: 联系人姓名（未知则空字符串）
- contact_phone: 联系电话（未知则空字符串）
- company: 公司名（未知则空字符串）
- requirement: 客户需求/关注点（一句话概括，未知则空字符串）
- intent_level: 意向度，仅可选 "high" | "medium" | "low"
- follow_status: 跟进状态，仅可选 "following" | "won" | "lost"
- summary: 沟通要点摘要（2-3 句话）`;

const REPORT_SYSTEM = `你是一名资深销售顾问。根据客户信息和跟进历史，生成一份客户分析报告，使用 Markdown 格式，包含四个小节：
## 状态变化
## 重点提醒
## 潜在成交机会
## 后续跟进建议
语言简洁、有判断、可执行，控制在 400 字以内。`;

/** 真实 LLM 提取 */
async function llmExtract(rawText: string): Promise<ExtractedFields> {
  const client = getClient();
  if (!client) return mockExtract(rawText);
  const model = process.env.DEEPSEEK_MODEL || "deepseek-chat";
  const resp = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: EXTRACT_SYSTEM },
      { role: "user", content: rawText },
    ],
    temperature: 0.2,
    response_format: { type: "json_object" },
  });
  const text = resp.choices[0]?.message?.content || "{}";
  try {
    return JSON.parse(text) as ExtractedFields;
  } catch {
    return mockExtract(rawText);
  }
}

/** Mock 提取（无 API Key 时降级） */
export function mockExtract(rawText: string): ExtractedFields {
  const phoneMatch = rawText.match(/1[3-9]\d{9}/);
  const companyMatch = rawText.match(
    /([\u4e00-\u9fa5A-Za-z]{2,12})(公司|科技|集团|有限)/
  );
  const nameMatch = rawText.match(
    /(?:我是|我叫|联系人|姓名[:：\s]*|客户[:：\s]*)([\u4e00-\u9fa5]{2,4})/
  );

  let intent: IntentLevel = "medium";
  if (/意向|感兴趣|想用|签约|成交|马上|本周/.test(rawText)) intent = "high";
  else if (/再看看|考虑|暂无|不用|拒绝|流失/.test(rawText)) intent = "low";

  let status: FollowStatus = "following";
  if (/签约|成交|付款|合同|已合作/.test(rawText)) status = "won";
  else if (/流失|不做了|放弃|拒绝合作|不要了/.test(rawText)) status = "lost";

  const summary =
    rawText.length > 120 ? rawText.slice(0, 120) + "..." : rawText;

  return {
    contact_name: nameMatch?.[1] || "",
    contact_phone: phoneMatch?.[0] || "",
    company: companyMatch ? companyMatch[0] : "",
    requirement: extractRequirement(rawText),
    intent_level: intent,
    follow_status: status,
    summary,
  };
}

function extractRequirement(text: string): string {
  const m = text.match(
    /(?:需求|想要|希望|关注|想了解|问题是|痛点)[:：\s]*([^\n。！!?]{4,40})/
  );
  return m?.[1] || "";
}

/** 真实 LLM 报告 */
async function llmReport(
  customer: Customer,
  followups: Followup[]
): Promise<string> {
  const client = getClient();
  if (!client) return mockReport(customer, followups);
  const model = process.env.DEEPSEEK_MODEL || "deepseek-chat";
  const ctx = `客户：${customer.company}（${customer.contact_name}）
当前状态：${customer.follow_status}，意向度：${customer.intent_level}
需求：${customer.requirement || "未记录"}
最后联系：${customer.last_contact_at || "无"}

跟进历史：
${followups
  .map(
    (f, i) =>
      `${i + 1}. [${f.created_at}] ${f.content}${
        f.contact_time ? `（沟通时间:${f.contact_time}）` : ""
      }`
  )
  .join("\n")}`;

  const resp = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: REPORT_SYSTEM },
      { role: "user", content: ctx },
    ],
    temperature: 0.4,
  });
  return resp.choices[0]?.message?.content || mockReport(customer, followups);
}

/** Mock 报告 */
export function mockReport(
  customer: Customer,
  followups: Followup[]
): string {
  const statusMap: Record<string, string> = {
    following: "跟进中",
    won: "已成交",
    lost: "流失",
  };
  const intentMap: Record<string, string> = {
    high: "高意向",
    medium: "中意向",
    low: "低意向",
  };
  const last = followups[followups.length - 1];
  const days = customer.last_contact_at
    ? Math.max(
        0,
        Math.floor(
          (Date.now() - new Date(customer.last_contact_at).getTime()) /
            86400000
        )
      )
    : null;

  return `## 状态变化
${customer.company} 当前处于「${statusMap[customer.follow_status]}」，意向度「${
    intentMap[customer.intent_level]
  }」。共记录跟进 ${followups.length} 次，最近一次：${last ? last.content : "暂无"}。

## 重点提醒
${
    days !== null && days > 5
      ? `⚠️ 距上次联系已 ${days} 天，存在跟进断档风险，建议尽快触达。`
      : "跟进节奏正常，保持现有频率。"
  }
${
    customer.intent_level === "high" && customer.follow_status === "following"
      ? "该客户高意向且未成交，是本周期重点推进对象。"
      : ""
  }

## 潜在成交机会
${customer.requirement || "需求待进一步挖掘"}。
${
    customer.intent_level === "high"
      ? "客户意向明确，可在 1-2 周内推动方案报价。"
      : "意向中等，建议持续培育，提供案例增强信心。"
  }

## 后续跟进建议
1. 针对客户关注点准备针对性方案材料
2. 安排一次深度需求确认沟通
3. 若 3 天内无进展，升级由主管协助推进
> 本报告由 Mock 模式生成（未配置 DEEPSEEK_API_KEY），填入 Key 后将调用真实大模型。`;
}

export const extractFollowup = llmExtract;
export const generateReport = llmReport;
