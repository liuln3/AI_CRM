import { getSession } from "@/lib/auth";
import { getCustomersByOwner, getTeamCustomers } from "@/lib/queries";
import { INTENT_LABEL, FOLLOW_STATUS_LABEL } from "@/lib/types";
import Link from "next/link";

export const runtime = "nodejs";

export default async function CustomersPage() {
  const session = await getSession();
  if (!session) return null;
  const isSales = session.role === "sales";
  const customers = isSales
    ? getCustomersByOwner(session.id).map((c) => ({ ...c, owner_name: "" }))
    : getTeamCustomers();

  const statusClass: Record<string, string> = {
    won: "bg-ice text-carbon",
    lost: "bg-frost text-mist",
    following: "bg-frost text-graphite",
  };
  const intentClass: Record<string, string> = {
    high: "bg-ice text-carbon",
    medium: "bg-frost text-graphite",
    low: "bg-frost text-mist",
  };

  return (
    <div
      data-agent-context
      data-agent-page="/customers"
      className="mx-auto max-w-[1440px] px-8 py-10"
    >
      <div className="mb-8">
        <h1
          className="text-[28px] font-semibold leading-[1.18] text-carbon"
          style={{ letterSpacing: "0.196px" }}
        >
          {isSales ? "我的客户" : "团队客户"}
        </h1>
        <p className="mt-1 text-[17px] font-light text-ash">
          {isSales
            ? "你负责的客户，点击进入详情可录入跟进"
            : "团队全部客户，按最后联系时间排序"}
        </p>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-hairline bg-frost text-[12px] text-ash">
              <th className="px-5 py-3 text-left font-semibold">公司 / 联系人</th>
              {!isSales && (
                <th className="px-5 py-3 text-left font-semibold">负责人</th>
              )}
              <th className="px-5 py-3 text-left font-semibold">联系方式</th>
              <th className="px-5 py-3 text-left font-semibold">跟进状态</th>
              <th className="px-5 py-3 text-left font-semibold">意向度</th>
              <th className="px-5 py-3 text-left font-semibold">最后联系</th>
              <th className="px-5 py-3 text-right font-semibold">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {customers.length === 0 ? (
              <tr>
                <td
                  colSpan={isSales ? 6 : 7}
                  className="py-16 text-center text-[14px] text-mist"
                >
                  暂无客户，去
                  <Link href="/leads" className="btn-ghost mx-1">
                    线索池
                  </Link>
                  认领吧
                </td>
              </tr>
            ) : (
              customers.map((c) => (
                <tr key={c.id} className="transition-colors hover:bg-frost">
                  <td className="px-5 py-3.5">
                    <div className="text-[14px] font-normal text-carbon">
                      {c.company}
                    </div>
                    <div className="text-[12px] text-mist">
                      {c.contact_name}
                    </div>
                  </td>
                  {!isSales && (
                    <td className="px-5 py-3.5 text-[14px] text-graphite">
                      {c.owner_name}
                    </td>
                  )}
                  <td className="px-5 py-3.5 text-[14px] text-graphite">
                    {c.contact_phone || "—"}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`tag ${statusClass[c.follow_status]}`}>
                      {FOLLOW_STATUS_LABEL[c.follow_status]}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`tag ${intentClass[c.intent_level]}`}>
                      {INTENT_LABEL[c.intent_level]}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-[12px] text-mist">
                    {c.last_contact_at
                      ? c.last_contact_at.slice(0, 10)
                      : "—"}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link
                      href={`/customers/${c.id}`}
                      className="btn-ghost text-[13px]"
                    >
                      查看详情 →
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
