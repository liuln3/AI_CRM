import { getSession } from "@/lib/auth";
import {
  getCustomerById,
  getFollowupsByCustomer,
  getUserById,
} from "@/lib/queries";
import { notFound } from "next/navigation";
import Link from "next/link";
import EditableCustomerInfo from "@/components/EditableCustomerInfo";
import FollowupRecorder from "@/components/FollowupRecorder";
import { INTENT_LABEL, FOLLOW_STATUS_LABEL } from "@/lib/types";

export const runtime = "nodejs";

export default async function CustomerDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getSession();
  if (!session) return null;
  const customer = getCustomerById(Number(params.id));
  if (!customer) notFound();
  const followups = getFollowupsByCustomer(customer.id);
  const owner = getUserById(customer.owner_id);

  const canEdit =
    session.role !== "sales" || customer.owner_id === session.id;

  const statusClass: Record<string, string> = {
    won: "bg-ice text-carbon",
    lost: "bg-frost text-mist",
    following: "bg-frost text-graphite",
  };

  return (
    <div
      data-agent-context
      data-agent-page={`/customers/${customer.id}`}
      data-agent-object={`customer:${customer.id}`}
      data-agent-label={customer.company}
      className="mx-auto max-w-5xl space-y-6 px-8 py-10"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/customers"
            className="btn-ghost text-[13px]"
          >
            ← 我的客户
          </Link>
          <h1
            className="text-[28px] font-semibold leading-[1.18] text-carbon"
            style={{ letterSpacing: "0.196px" }}
          >
            {customer.company}
          </h1>
          <span className={`tag ${statusClass[customer.follow_status]}`}>
            {FOLLOW_STATUS_LABEL[customer.follow_status]}
          </span>
        </div>
        <FollowupRecorder customerId={customer.id} />
      </div>

      <EditableCustomerInfo customer={customer} canEdit={canEdit} />

      <div className="card p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-[17px] font-semibold text-carbon">
            沟通记录与跟进历史
          </h2>
          <span className="text-[12px] text-mist">
            共 {followups.length} 条记录
          </span>
        </div>

        {followups.length === 0 ? (
          <div className="py-12 text-center text-[14px] text-mist">
            暂无跟进记录，点击右上角「对话式录入跟进」开始记录
          </div>
        ) : (
          <div className="relative pl-6">
            <div className="absolute bottom-2 left-[5px] top-2 w-px bg-hairline" />
            <div className="space-y-6">
              {followups.map((f) => {
                const ex = (() => {
                  try {
                    return JSON.parse(f.extracted || "{}");
                  } catch {
                    return {};
                  }
                })();
                const creator = getUserById(f.created_by);
                return (
                  <div key={f.id} className="relative">
                    <div className="absolute -left-[22px] top-1 h-2.5 w-2.5 rounded-full bg-signal ring-4 ring-white" />
                    <div className="mb-1.5 flex items-center gap-2 text-[12px] text-mist">
                      <span>{f.created_at.slice(0, 16)}</span>
                      {creator && <span>· {creator.name}</span>}
                      {f.contact_time && (
                        <span>· 沟通时间 {f.contact_time.slice(0, 10)}</span>
                      )}
                    </div>
                    <div className="rounded-lg bg-frost px-4 py-3 text-[14px] leading-relaxed text-graphite">
                      {f.content}
                    </div>
                    {(ex.intent_level || ex.follow_status) && (
                      <div className="mt-2 flex gap-1.5">
                        {ex.intent_level && (
                          <span className="tag bg-white text-graphite">
                            {INTENT_LABEL[ex.intent_level as keyof typeof INTENT_LABEL] ||
                              ex.intent_level}
                          </span>
                        )}
                        {ex.follow_status && (
                          <span className="tag bg-white text-graphite">
                            {FOLLOW_STATUS_LABEL[ex.follow_status as keyof typeof FOLLOW_STATUS_LABEL] ||
                              ex.follow_status}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-5 flex items-center gap-2 border-t border-hairline pt-4 text-[12px] text-mist">
          <span>负责人：{owner?.name || "—"}</span>
          <span>·</span>
          <span>
            最后联系：
            {customer.last_contact_at
              ? customer.last_contact_at.slice(0, 10)
              : "—"}
          </span>
        </div>
      </div>
    </div>
  );
}
