"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { submitReport } from "@/lib/actions";
import type { Report } from "@/lib/types";

export function ReportActions({ report }: { report: Report }) {
  const [loading, setLoading] = useState(false);

  if (report.status !== "draft") return null;

  async function handle() {
    setLoading(true);
    await submitReport(report.id);
    setLoading(false);
  }

  return (
    <Button size="sm" variant="outline" disabled={loading} onClick={handle}>
      {loading ? "Submitting…" : "Submit"}
    </Button>
  );
}
