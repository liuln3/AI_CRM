"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ClaimButton({ leadId }: { leadId: number }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function claim() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/leads/${leadId}/claim`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "认领失败");
        return;
      }
      setDone(true);
      setTimeout(() => router.push(`/customers/${data.customerId}`), 600);
    } catch {
      setError("网络错误");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <span className="text-[12px] font-normal text-graphite">
        ✓ 已认领，跳转中…
      </span>
    );
  }
  return (
    <button
      onClick={claim}
      disabled={loading}
      className="btn-filled"
    >
      {loading ? "认领中…" : "认领"}
      {error && <span className="ml-1 text-white/70">{error}</span>}
    </button>
  );
}
