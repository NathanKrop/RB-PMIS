"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { logDataQualityCheck } from "@/lib/actions";
import { ClipboardPlus } from "lucide-react";

type CheckInput = {
  departmentId: string | null;
  checkType: "completeness" | "anomaly" | "duplicate";
  entity: string;
  issue: string;
  severity: "low" | "medium" | "high";
};

export function LogCheckButton({ check }: { check: CheckInput }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function handle() {
    setLoading(true); setError(null);
    const result = await logDataQualityCheck(check);
    if (result?.error) setError(result.error);
    setLoading(false);
  }
  return <div className="shrink-0 text-right"><Button type="button" variant="ghost" size="sm" onClick={handle} disabled={loading} className="h-7 gap-1 text-xs"><ClipboardPlus className="h-3.5 w-3.5" />{loading ? "Logging..." : "Log issue"}</Button>{error && <p className="mt-1 max-w-40 text-xs text-destructive">{error}</p>}</div>;
}
