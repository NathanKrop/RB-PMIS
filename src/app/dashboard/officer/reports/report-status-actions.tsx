"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { updateReportStatus } from "@/lib/actions";
import type { Report } from "@/lib/types";

export function ReportStatusActions({ report }: { report: Report }) {
  const [loading, setLoading] = useState(false);

  async function handle(status: string) {
    setLoading(true);
    await updateReportStatus(report.id, status);
    setLoading(false);
  }

  if (report.status === "submitted") {
    return (
      <div className="flex gap-2">
        <Button size="sm" variant="outline" disabled={loading} onClick={() => handle("approved")}>
          Approve
        </Button>
        <Button size="sm" variant="destructive" disabled={loading} onClick={() => handle("rejected")}>
          Reject
        </Button>
      </div>
    );
  }
  if (report.status === "approved") {
    return (
      <Button size="sm" variant="outline" disabled={loading} onClick={() => handle("verified")}>
        Verify
      </Button>
    );
  }
  return null;
}
