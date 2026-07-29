"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { updateReportStatus } from "@/lib/actions";
import type { Report } from "@/lib/types";

export function ReportStatusActions({ report, allowApprove = false }: { report: Report; allowApprove?: boolean }) {
  const [loading, setLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handle(status: string, reason?: string) {
    setLoading(true);
    setError(null);
    const result = await updateReportStatus(report.id, status, reason);
    if (result?.error) {
      setError(result.error);
    }
    setLoading(false);
    setIsRejectOpen(false);
  }

  const actions = [] as ReactNode[];

  if (report.status === "submitted") {
    actions.push(
      <Button key="review" size="sm" variant="outline" disabled={loading} onClick={() => handle("reviewed")}>
        Review
      </Button>
    );
  }

  if (report.status === "reviewed") {
    actions.push(
      <Button key="verify" size="sm" variant="outline" disabled={loading} onClick={() => handle("verified")}>
        Verify
      </Button>
    );
  }

  if (report.status === "verified" && allowApprove) {
    actions.push(
      <Button key="approve" size="sm" variant="outline" disabled={loading} onClick={() => handle("approved")}>
        Approve
      </Button>
    );
  }

  if (["submitted", "reviewed", "verified"].includes(report.status)) {
    actions.push(
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen} key="reject-dialog">
        <DialogTrigger asChild>
          <Button size="sm" variant="destructive" disabled={loading}>
            Reject
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Report</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejection_reason">Rejection Reason</Label>
              <Input
                id="rejection_reason"
                value={rejectionReason}
                onChange={(event) => setRejectionReason(event.target.value)}
                placeholder="Explain why this report is being rejected"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setIsRejectOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                variant="destructive"
                disabled={loading || !rejectionReason.trim()}
                onClick={() => handle("rejected", rejectionReason)}
              >
                Confirm Reject
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (actions.length === 0) return null;

  return <div className="flex flex-wrap gap-2">{actions}</div>;
}
