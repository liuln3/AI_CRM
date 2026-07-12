"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ExtractedFields, IntentLevel, FollowStatus } from "@/lib/types";
import { INTENT_LABEL, FOLLOW_STATUS_LABEL } from "@/lib/types";

export default function FollowupRecorder({
  customerId,
}: {
  customerId: number;
}) {
  const [open, setOpen] = useState(false);
  const [rawText, setRawText] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [extracted, setExtracted] = useState<ExtractedFields | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500000) {
      setError("文件过大，请小于 500KB（支持 .txt/.md）");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setRawText((prev) => (prev ? prev + "\n\n" : "") + String(reader.result || ""));
    };
    reader.readAsText(file);
  }

  async function extract() {
    if (!rawText.trim()) return;
    setExtracting(true);
    setError("");
    try {
      const res = await fetch("/api/agent/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "提取失败");
        return;
      }
      setExtracted(data.extracted);
    } catch {
      setError("网络错误");
    } finally {
      setExtracting(false);
    }
  }

  async function save() {
    if (!extracted) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/agent/followup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId, rawText, extracted }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "保存失败");
        return;
      }
      setOpen(false);
      setRawText("");
      setExtracted(null);
      router.refresh();
    } catch {
      setError("网络错误");
    } finally {
      setSaving(false);
    }
  }

  function reset() {
    setRawText("");
    setExtracted(null);
    setError("");
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-filled-lg">
        💬 对话式录入跟进
      </button>

      {open && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 p-4">
          <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-hairline bg-white">
            <div className="flex items-center justify-between border-b border-hairline px-6 py-4">
              <h3 className="text-[17px] font-semibold text-carbon">
                对话式录入跟进
              </h3>
              <button
                onClick={() => {
                  setOpen(false);
                  reset();
                }}
                className="text-2xl leading-none text-mist hover:text-carbon"
              >
                ×
              </button>
            </div>

            <div className="space-y-4 p-6">
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-[13px] font-semibold text-carbon">
                    粘贴聊天记录 / 客户备注 / 沟通内容
                  </label>
                  <label className="btn-ghost cursor-pointer text-[12px]">
                    📎 上传会议纪要(.txt/.md)
                    <input
                      type="file"
                      accept=".txt,.md,.text"
                      onChange={handleFile}
                      className="hidden"
                    />
                  </label>
                </div>
                <textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  rows={6}
                  placeholder={"例如：\n刚和王总通了电话，他说对我们的AI录入功能很感兴趣，预算大概5万，下周二约了演示。电话13800001111，公司是南京云栈科技。"}
                  className="input w-full"
                />
              </div>

              {!extracted && (
                <button
                  onClick={extract}
                  disabled={!rawText.trim() || extracting}
                  className="btn-filled"
                >
                  {extracting ? "🤖 AI 提取中…" : "🤖 让 AI 提取关键字段"}
                </button>
              )}

              {extracted && (
                <div className="space-y-3 rounded-lg bg-ice p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-semibold text-carbon">
                      ✅ AI 提取结果（可微调后保存）
                    </span>
                    <button
                      onClick={reset}
                      className="text-[12px] text-mist hover:text-carbon"
                    >
                      重新提取
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <ExInput
                      label="联系人"
                      value={extracted.contact_name || ""}
                      onChange={(v) =>
                        setExtracted({ ...extracted, contact_name: v })
                      }
                    />
                    <ExInput
                      label="电话"
                      value={extracted.contact_phone || ""}
                      onChange={(v) =>
                        setExtracted({ ...extracted, contact_phone: v })
                      }
                    />
                    <ExInput
                      label="公司"
                      value={extracted.company || ""}
                      onChange={(v) =>
                        setExtracted({ ...extracted, company: v })
                      }
                    />
                    <ExSelect
                      label="意向度"
                      value={extracted.intent_level || "medium"}
                      options={Object.entries(INTENT_LABEL)}
                      onChange={(v) =>
                        setExtracted({
                          ...extracted,
                          intent_level: v as IntentLevel,
                        })
                      }
                    />
                    <ExSelect
                      label="跟进状态"
                      value={extracted.follow_status || "following"}
                      options={Object.entries(FOLLOW_STATUS_LABEL)}
                      onChange={(v) =>
                        setExtracted({
                          ...extracted,
                          follow_status: v as FollowStatus,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[12px] text-ash">
                      需求
                    </label>
                    <input
                      value={extracted.requirement || ""}
                      onChange={(e) =>
                        setExtracted({
                          ...extracted,
                          requirement: e.target.value,
                        })
                      }
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[12px] text-ash">
                      沟通要点摘要
                    </label>
                    <textarea
                      value={extracted.summary || ""}
                      onChange={(e) =>
                        setExtracted({ ...extracted, summary: e.target.value })
                      }
                      rows={2}
                      className="input w-full"
                    />
                  </div>
                </div>
              )}

              {error && (
                <div className="rounded-lg bg-frost px-3 py-2 text-[13px] text-smoke">
                  {error}
                </div>
              )}

              {extracted && (
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setOpen(false);
                      reset();
                    }}
                    className="btn-outlined"
                  >
                    取消
                  </button>
                  <button onClick={save} disabled={saving} className="btn-filled">
                    {saving ? "保存中…" : "确认保存入库"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ExInput({
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

function ExSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: [string, string][];
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
        {options.map(([k, v]) => (
          <option key={k} value={k}>
            {v}
          </option>
        ))}
      </select>
    </div>
  );
}
