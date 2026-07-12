import "server-only";
import { getDb } from "./db";
import bcrypt from "bcryptjs";

/**
 * 模拟数据初始化脚本：
 *   node --experimental-strip-types scripts/seed.ts
 * 也会在应用启动时由 ensureSeed() 自动调用（仅当 users 表为空时）。
 */
export async function seedIfEmpty() {
  const db = getDb();
  const userCount = db.prepare("SELECT COUNT(*) as c FROM users").get() as {
    c: number;
  };
  if (userCount.c > 0) return;

  const now = new Date();
  const iso = (d: Date) => d.toISOString().slice(0, 19).replace("T", " ");
  const daysAgo = (n: number) =>
    iso(new Date(now.getTime() - n * 86400000));

  // ---- 用户 ----
  const adminHash = await bcrypt.hash("admin123", 10);
  const managerHash = await bcrypt.hash("manager123", 10);
  const salesHash = await bcrypt.hash("sales123", 10);

  const insertUser = db.prepare(
    "INSERT INTO users (username, password_hash, name, role, created_at) VALUES (?,?,?,?,?)"
  );
  insertUser.run("admin", adminHash, "系统管理员", "admin", daysAgo(40));
  insertUser.run("manager", managerHash, "张主管", "manager", daysAgo(40));
  insertUser.run("sales01", salesHash, "李销售", "sales", daysAgo(30));
  insertUser.run("sales02", salesHash, "王销售", "sales", daysAgo(30));
  insertUser.run("sales03", salesHash, "赵销售", "sales", daysAgo(20));

  const salesIds = [3, 4, 5]; // sales01/02/03

  // ---- 线索池（待认领 + 已认领）----
  const sources = [
    "官网咨询",
    "百度推广",
    "转介绍",
    "展会获客",
    "主动外呼",
    "内容营销",
  ];
  const companies = [
    ["南京云栈科技", "陈总"],
    ["苏州数联信息", "刘经理"],
    ["杭州智造工场", "王总"],
    ["上海博远数据", "李总"],
    ["无锡信安网络", "赵经理"],
    ["常州恒达制造", "孙总"],
    ["南京翼飞教育", "周老师"],
    ["合肥创芯电子", "吴总"],
    ["宁波海纳物流", "郑经理"],
    ["扬州盛世传媒", "钱总"],
    ["镇江新锐软件", "冯总"],
    ["南通联泰贸易", "蒋经理"],
    ["南京慧通医疗", "韩总"],
    ["盐城丰禾农业", "沈总"],
    ["泰州宏图建筑", "杨经理"],
    ["徐州隆源能源", "朱总"],
    ["南京极客星球", "何总"],
    ["连云港远洋水产", "秦经理"],
    ["宿迁云帆电商", "尤总"],
    ["淮安明达金融", "许总"],
    ["南京拓维咨询", "马经理"],
    ["苏州聚能新能源", "袁总"],
    ["常州易联网络", "石总"],
    ["无锡星河生物", "姚经理"],
    ["南通蓝鲸数据", "毛总"],
    ["南京领航智能", "孔总"],
    ["杭州清研环保", "曹经理"],
    ["上海数擎AI", "严总"],
    ["苏州微创医疗", "华总"],
    ["宁波智联家居", "金经理"],
  ];

  const intents: ("high" | "medium" | "low")[] = [
    "high",
    "medium",
    "low",
  ];
  const insertLead = db.prepare(
    `INSERT INTO leads (company, contact_name, contact_phone, source, intent_level, status, remark, created_at, claimed_by, claimed_at)
     VALUES (?,?,?,?,?,?,?,?,?,?)`
  );

  let leadIdx = 0;
  // 20 条待认领
  for (let i = 0; i < 20; i++) {
    const [c, n] = companies[leadIdx % companies.length];
    leadIdx++;
    insertLead.run(
      c + `(线索${i + 1})`,
      n,
      `13${Math.floor(100000000 + Math.random() * 899999999)}`,
      sources[i % sources.length],
      intents[i % 3],
      "pending",
      "来自市场部投放，需尽快跟进",
      daysAgo(Math.floor(Math.random() * 7) + 1),
      null,
      null
    );
  }
  // 30 条已认领（转为客户）
  const leadIds: number[] = [];
  for (let i = 0; i < 30; i++) {
    const [c, n] = companies[leadIdx % companies.length];
    leadIdx++;
    const owner = salesIds[i % salesIds.length];
    const claimedAt = daysAgo(Math.floor(Math.random() * 25) + 5);
    const info = insertLead.run(
      c,
      n,
      `13${Math.floor(100000000 + Math.random() * 899999999)}`,
      sources[i % sources.length],
      intents[i % 3],
      "claimed",
      "已认领",
      daysAgo(Math.floor(Math.random() * 25) + 6),
      owner,
      claimedAt
    );
    leadIds.push(Number(info.lastInsertRowid));
  }

  // ---- 客户（来自已认领线索）----
  const insertCustomer = db.prepare(
    `INSERT INTO customers (lead_id, owner_id, company, contact_name, contact_phone, email, intent_level, follow_status, requirement, last_contact_at, created_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)`
  );
  const followStatuses: ("following" | "won" | "lost")[] = [
    "following",
    "following",
    "following",
    "won",
    "lost",
  ];
  const requirements = [
    "需要一套客户管理系统替代Excel",
    "关注销售团队跟进效率提升",
    "希望实现线索自动分配",
    "需要数据看板做月度复盘",
    "关注AI辅助录入降低销售负担",
    "需要多团队权限管理",
    "希望对接企业微信",
    "关注成交转化率分析",
  ];

  const customerIds: number[] = [];
  leadIds.forEach((leadId, i) => {
    const owner = salesIds[i % salesIds.length];
    const fs = followStatuses[i % followStatuses.length];
    const lastContact = daysAgo(Math.floor(Math.random() * 10));
    const info = insertCustomer.run(
      leadId,
      owner,
      companies[i % companies.length][0],
      companies[i % companies.length][1],
      `13${Math.floor(100000000 + Math.random() * 899999999)}`,
      `contact${i + 1}@example.com`,
      intents[i % 3],
      fs,
      requirements[i % requirements.length],
      fs === "following" ? lastContact : daysAgo(Math.floor(Math.random() * 20) + 10),
      daysAgo(Math.floor(Math.random() * 25) + 5)
    );
    customerIds.push(Number(info.lastInsertRowid));
  });

  // ---- 跟进记录（每客户 2-5 条）----
  const insertFollowup = db.prepare(
    `INSERT INTO followups (customer_id, content, raw_input, extracted, intent_level, follow_status, contact_time, created_by, created_at)
     VALUES (?,?,?,?,?,?,?,?,?)`
  );
  const templates = [
    "电话沟通了客户需求，客户对AI录入功能很感兴趣，约下周演示。",
    "微信聊了价格方案，客户觉得偏贵，需要准备性价比对比。",
    "上门拜访，见了客户负责人，演示了产品，反馈不错。",
    "发了方案报价邮件，等待客户回复。",
    "客户回复说内部还在走审批流程，预计本周有结果。",
    "客户提出要增加自定义字段功能，已反馈给产品。",
    "跟进客户使用情况，已上线试用了3天，反馈良好。",
    "客户确认签约，本周完成合同签署。",
    "客户表示预算紧张暂缓，下季度再推进。",
    "转介绍了新客户，已录入线索池。",
  ];

  customerIds.forEach((cid, i) => {
    const owner = salesIds[i % salesIds.length];
    const count = 2 + (i % 4);
    for (let j = 0; j < count; j++) {
      const t = templates[(i + j) % templates.length];
      insertFollowup.run(
        cid,
        t,
        `原始记录：${t}`,
        JSON.stringify({ summary: t }),
        intents[(i + j) % 3],
        j === count - 1 ? followStatuses[i % followStatuses.length] : "following",
        daysAgo((count - j) * 2 + Math.floor(Math.random() * 3)),
        owner,
        daysAgo((count - j) * 2)
      );
    }
  });

  // ---- 站内消息（给每个销售一条昨日动态）----
  const insertMsg = db.prepare(
    "INSERT INTO messages (user_id, title, content, type, read, created_at) VALUES (?,?,?,?,?,?)"
  );
  salesIds.forEach((uid) => {
    insertMsg.run(
      uid,
      "昨日客户动态摘要",
      "新增客户 1 位；状态变化：苏州数联信息 升为高意向；待跟进客户 3 位；重点提醒：南京云栈科技 已 4 天未联系。",
      "daily_push",
      0,
      daysAgo(0)
    );
  });

  console.log("[seed] 模拟数据初始化完成：5 用户 / 50 线索 / 30 客户 / 100+ 跟进");
}

/** 直接运行脚本 */
if (require.main === module) {
  seedIfEmpty()
    .then(() => {
      console.log("done");
      process.exit(0);
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
