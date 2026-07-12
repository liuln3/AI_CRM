"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Customer, IntentLevel, FollowStatus } from "@/lib/types";
import { INTENT_LABEL, FOLLOW_STATUS_LABEL } from "@/lib/types";

export default function EditableCustomerInfo({
  customer,
  canEdit,
}: {
  customer: Customer;
  canEdit: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    company: customer.company,
    contact_name: customer.contact_name,
    contact_phone: customer.contact_phone || "",
    email: customer.email || "",
    intent_level: customer.intent_level,
    follow_status: customer.follow_status,
    requirement: customer.requirement || "",
  });
  const router = useRouter();

  async function save() {
    setLoading(true);
    try {
      await fetch(`/api/customers/${customer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setEditing(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (!editing) {
    return (
      <div className="card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[17px] font-semibold text-carbon">
            客户基础信息
          </h2>
          {canEdit && (
            <button
              onClick={() => setEditing(true)}
              className="btn-ghost text-[13px]"
            >
              ✏️ 编辑
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-3">
          <Field label="公司" value={customer.company} />
          <Field label="联系人" value={customer.contact_name} />
          <Field label="电话" value={customer.contact_phone || "—"} />
          <Field label="邮箱" value={customer.email || "—"} />
          <Field
            label="跟进状态"
            value={FOLLOW_STATUS_LABEL[customer.follow_status]}
            tag
          />
          <Field
            label="意向度"
            value={INTENT_LABEL[customer.intent_level]}
            tag
          />
          <div className="col-span-2">
            <Field label="需求" value={customer.requirement || "—"} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card border-link p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[17px] font-semibold text-carbon">编辑客户信息</h2>
        <button
          onClick={() => setEditing(false)}
          className="text-[13px] text-mist hover:text-carbon"
        >
          取消
        </button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="公司" value={form.company} onChange={(v) => setForm({ ...form, company: v })} />
        <Input label="联系人" value={form.contact_name} onChange={(v) => setForm({ ...form, contact_name: v })} />
        <Input label="电话" value={form.contact_phone} onChange={(v) => setForm({ ...form, contact_phone: v })} />
        <Input label="邮箱" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
        <Select
          label="跟进状态"
          value={form.follow_status}
          options={Object.entries(FOLLOW_STATUS_LABEL).map(([k, v]) => ({ value: k, label: v }))}
          onChange={(v) => setForm({ ...form, follow_status: v as FollowStatus })}
        />
        <Select
          label="意向度"
          value={form.intent_level}
          options={Object.entries(INTENT_LABEL).map(([k, v]) => ({ value: k, label: v }))}
          onChange={(v) => setForm({ ...form, intent_level: v as IntentLevel })}
        />
        <div className="col-span-2">
          <label className="mb-1 block text-[12px] text-ash">需求</label>
          <textarea
            value={form.requirement}
            onChange={(e) => setForm({ ...form, requirement: e.target.value })}
            rows={2}
            className="input w-full"
          />
        </div>
      </div>
      <div className="mt-5 flex gap-2">
        <button onClick={save} disabled={loading} className="btn-filled">
          {loading ? "保存中…" : "保存"}
        </button>
        <button
          onClick={() => setEditing(false)}
          className="btn-outlined"
        >
          取消
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, tag }: { label: string; value: string; tag?: boolean }) {
  return (
    <div className="flex">
      <span className="w-20 flex-shrink-0 text-[13px] text-mist">{label}</span>
      {tag ? (
        <span className="tag bg-frost text-graphite">{value}</span>
      ) : (
        <span className="text-[14px] text-carbon">{value}</span>
      )}
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-[12px] text-ash">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input w-full"
      />
    </div>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-[12px] text-ash">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input w-full bg-white"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
