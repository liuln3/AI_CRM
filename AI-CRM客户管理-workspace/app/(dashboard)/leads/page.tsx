import { getPendingLeads } from "@/lib/queries";
import { INTENT_LABEL } from "@/lib/types";
import ClaimButton from "@/components/ClaimButton";

export const runtime = "nodejs";

export default async function LeadsPage() {
  const leads = getPendingLeads();

  const intentClass: Record<string, string> = {
    high: "bg-ice text-carbon",
    medium: "bg-frost text-graphite",
    low: "bg-frost text-mist",
  };

  return (
    <div
      data-agent-context
      data-agent-page="/leads"
      className="mx-auto max-w-[1440px] px-8 py-10"
    >
      <div className="mb-8">
        <h1
          className="text-[28px] font-semibold leading-[1.18] text-carbon"
          style={{ letterSpacing: "0.196px" }}
        >
          线索池
        </h1>
        <p className="mt-1 text-[17px] font-light text-ash">
          待认领线索 {leads.length} 条，点击「认领」即可领取并转为你的客户
        </p>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-hairline bg-frost text-[12px] font-semibold text-ash">
              <th className="px-5 py-3 text-left font-semibold">公司 / 联系人</th>
              <th className="px-5 py-3 text-left font-semibold">联系方式</th>
              <th className="px-5 py-3 text-left font-semibold">来源</th>
              <th className="px-5 py-3 text-left font-semibold">意向度</th>
              <th className="px-5 py-3 text-left font-semibold">进入时间</th>
              <th className="px-5 py-3 text-left font-semibold">备注</th>
              <th className="px-5 py-3 text-right font-semibold">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {leads.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-16 text-center text-[14px] text-mist">
                  暂无待认领线索
                </td>
              </tr>
            ) : (
              leads.map((l) => (
                <tr key={l.id} className="transition-colors hover:bg-frost">
                  <td className="px-5 py-3.5">
                    <div className="text-[14px] font-normal text-carbon">
                      {l.company}
                    </div>
                    <div className="text-[12px] text-mist">{l.contact_name}</div>
                  </td>
                  <td className="px-5 py-3.5 text-[14px] text-graphite">
                    {l.contact_phone || "—"}
                  </td>
                  <td className="px-5 py-3.5 text-[14px] text-graphite">
                    {l.source}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`tag ${intentClass[l.intent_level]}`}>
                      {INTENT_LABEL[l.intent_level]}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-[12px] text-mist">
                    {l.created_at.slice(0, 10)}
                  </td>
                  <td className="px-5 py-3.5 text-[12px] text-mist">
                    {l.remark || "—"}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <ClaimButton leadId={l.id} />
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
