import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  getCustomerById,
  getFollowupsByCustomer,
  getPendingLeads,
  getCustomersByOwner,
  getTeamCustomers,
  getDashboardStats,
  getMessagesByUser,
  buildDailyDigest,
} from "@/lib/queries";
import { generateReport, isLlmEnabled } from "@/lib/llm";
import { INTENT_LABEL, FOLLOW_STATUS_LABEL } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const { message, action, page, objectId, label } = await req.json();

  // 一键生成客户分析报告
  if (action === "report" && objectId) {
    const custId = parseCustomerId(objectId);
    if (!custId) {
      return NextResponse.json({
        content: "未识别到当前客户，请从客户详情页使用此功能。",
        type: "text",
      });
    }
    const customer = getCustomerById(custId);
    if (!customer) {
      return NextResponse.json({ content: "客户不存在。", type: "text" });
    }
    const followups = getFollowupsByCustomer(custId);
    const report = await generateReport(customer, followups);
    return NextResponse.json({
      content: report,
      type: "report",
    });
  }

  // 各 action 基于数据返回摘要
  let content = "";
  switch (action) {
    case "todo": {
      const isSales = session.role === "sales";
      const customers = isSales
        ? getCustomersByOwner(session.id)
        : getTeamCustomers();
      const pending = customers.filter((c) => c.follow_status === "following");
      const high = pending.filter((c) => c.intent_level === "high");
      const msgs = getMessagesByUser(session.id).filter((m) => !m.read);
      content = `📌 今日待办：\n• 待跟进客户 ${pending.length} 位，其中高意向 ${high.length} 位\n• 未读消息 ${msgs.length} 条\n${
        high.length
          ? "• 重点推进：" +
            high.slice(0, 3).map((c) => c.company).join("、")
          : ""
      }`;
      break;
    }
    case "leads_summary": {
      const leads = getPendingLeads();
      const high = leads.filter((l) => l.intent_level === "high");
      content = `🎯 线索池概况：\n• 待认领线索 ${leads.length} 条\n• 高意向 ${high.length} 条\n${
        high.length
          ? "• 建议优先认领：" +
            high.slice(0, 3).map((l) => l.company).join("、")
          : ""
      }`;
      break;
    }
    case "my_customers": {
      const isSales = session.role === "sales";
      const customers = isSales
        ? getCustomersByOwner(session.id)
        : getTeamCustomers();
      const following = customers.filter((c) => c.follow_status === "following");
      const won = customers.filter((c) => c.follow_status === "won");
      const stale = following.filter((c) => {
        if (!c.last_contact_at) return true;
        const days = Math.floor(
          (Date.now() - new Date(c.last_contact_at).getTime()) / 86400000
        );
        return days > 5;
      });
      content = `👥 ${
        isSales ? "我的客户" : "团队客户"
      }情况：\n• 跟进中 ${following.length} 位，已成交 ${won.length} 位\n• 超过 5 天未联系 ${stale.length} 位${
        stale.length ? "（建议尽快触达）" : ""
      }`;
      break;
    }
    case "followup_summary": {
      const custId = parseCustomerId(objectId);
      if (!custId) {
        content = "请在客户详情页使用此功能。";
        break;
      }
      const followups = getFollowupsByCustomer(custId);
      content = `📝 「${
        label || "该客户"
      }」近期跟进汇总（共 ${followups.length} 条）：\n${followups
        .slice(0, 5)
        .map((f, i) => `${i + 1}. [${f.created_at.slice(5, 10)}] ${f.content}`)
        .join("\n")}`;
      break;
    }
    case "team_conversion": {
      const scope = session.role === "sales" ? "mine" : "all";
      const stats = getDashboardStats(scope, session.id);
      content = `📊 ${
        scope === "mine" ? "我的" : "团队"
      }转化情况：\n• 客户总数 ${stats.total}，跟进中 ${stats.following}，已成交 ${stats.won}\n• 本周新增 ${stats.weekNew}，本月成交 ${stats.monthWon}`;
      break;
    }
    case "yesterday_digest": {
      content = "📬 昨日动态：\n" + buildDailyDigest(session.id, session.role);
      break;
    }
    case "guide_input": {
      content =
        "💬 对话式录入用法：\n1. 进入任意客户详情页\n2. 点击「对话式录入跟进」按钮\n3. 粘贴聊天记录或上传会议纪要（.txt/.md）\n4. 点击「让 AI 提取关键字段」\n5. 确认或微调提取结果\n6. 点击「确认保存入库」\n\nAI 会自动提取联系人、电话、需求、意向度、跟进状态，并更新客户信息和跟进历史。";
      break;
    }
    default: {
      // 自由输入：简单回应
      const llmOn = isLlmEnabled();
      content = llmOn
        ? `我收到你的问题：「${message}」\n我目前擅长处理：生成客户分析报告、汇总跟进、查看数据概况。你可以点击下方推荐问题，或在客户详情页让我一键生成报告。`
        : `我收到你的问题：「${message}」\n（当前为 Mock 模式，配置 DEEPSEEK_API_KEY 后可调用真实大模型进行自由对话。）\n推荐你试试点击下方推荐问题，或在客户详情页生成分析报告。`;
    }
  }

  return NextResponse.json({ content, type: "text" });
}

function parseCustomerId(objectId: string): number | null {
  if (!objectId) return null;
  const m = String(objectId).match(/customer:(\d+)/);
  return m ? Number(m[1]) : null;
}
