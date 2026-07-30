"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { submitReport } from "@/lib/actions";
import type { Report } from "@/lib/types";

const requiredDraftFields: Array<[string, string | null]> = [
  ["Outcome Progress", null],
  ["Key Results", null],
  ["Challenges", null],
  ["Adaptive Actions", null],
  ["Lessons Learned", null],
  ["Next Period Priorities", null],
];

export function ReportActions({ report }: { report: Report }) {
  const [loading, setLoading] = useState(false);

  if (report.status !== "draft") return null;

  const missingFields = requiredDraftFields
    .map(([label]) => [label, report[label.replace(/\s+/g, "_").toLowerCase() as keyof Report]] as [string, string | null])
    .filter(([, value]) => !value)
    .map(([label]) => label);

  const isIncomplete = missingFields.length > 0;

  async function handle() {
    setLoading(true);
    await submitReport(report.id);
    setLoading(false);
  }

  return (
    <div className="space-y-2">
      <Button
        size="sm"
        variant="outline"
        disabled={loading || isIncomplete}
        onClick={handle}
      >
        {loading ? "Submitting…" : isIncomplete ? "Finish Draft" : "Submit"}
      </Button>
      {isIncomplete && (
        <p className="text-xs text-muted-foreground">
          Draft incomplete: {missingFields.join(", ")}.
        </p>
      )}
    </div>
  );
}
