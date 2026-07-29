import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ShieldCheck, Sparkles } from "lucide-react";
import { ExportReportButtons } from "@/components/export-report-buttons";
import { ReportStatusActions } from "@/app/dashboard/officer/reports/report-status-actions";
import type { Report } from "@/lib/types";

const statusVariant: Record<string, "default" | "secondary" | "success" | "warning" | "destructive" | "outline"> = {
  approved: "success",
  verified: "outline",
  reviewed: "warning",
};

const statusLabel: Record<string, string> = {
  reviewed: "Ready for verification",
  verified: "Ready for final approval",
  approved: "Approved report",
};

const statusPillClass: Record<string, string> = {
  reviewed: "border-amber-300 bg-amber-50 text-amber-700",
  verified: "border-blue-300 bg-blue-50 text-blue-700",
  approved: "border-emerald-300 bg-emerald-50 text-emerald-700",
};

export default async function ManagementReportsPage() {
  const supabase = await createClient();

  const { data: reports } = await supabase
    .from("reports")
    .select("*, departments(name)")
    .in("status", ["reviewed", "verified", "approved"])
    .order("created_at", { ascending: false });

  const reviewedReports = (reports ?? []).filter((report) => report.status === "reviewed");
  const verifiedReports = (reports ?? []).filter((report) => report.status === "verified");
  const approvedReports = (reports ?? []).filter((report) => report.status === "approved");

  return (
    <div className="space-y-6">
      <div className="rounded-lg border-l-4 border-slate-300 bg-slate-50/60 p-4">
        <div>
          <h1 className="text-2xl font-semibold">Report queue</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Reviewed reports are ready for verification, verified reports are ready for final approval, and approved reports are finalized.
          </p>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center rounded-full border border-amber-300 px-2 py-0.5 text-amber-700">
            <ShieldCheck className="mr-1 h-3 w-3" />
            Reviewed
          </span>
          <span className="inline-flex items-center rounded-full border border-blue-300 px-2 py-0.5 text-blue-700">
            <Sparkles className="mr-1 h-3 w-3" />
            Verified
          </span>
          <span className="inline-flex items-center rounded-full border border-emerald-300 px-2 py-0.5 text-emerald-700">
            <CheckCircle className="mr-1 h-3 w-3" />
            Approved
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-3 mt-6">
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-amber-700">Reviewed</p>
          <p className="mt-2 text-lg font-semibold text-amber-900">{reviewedReports.length}</p>
          <p className="text-sm text-amber-700">Ready for verification</p>
        </div>
        <div className="rounded-lg border border-blue-300 bg-blue-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-blue-700">Verified</p>
          <p className="mt-2 text-lg font-semibold text-blue-900">{verifiedReports.length}</p>
          <p className="text-sm text-blue-700">Ready for final approval</p>
        </div>
        <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">Approved</p>
          <p className="mt-2 text-lg font-semibold text-emerald-900">{approvedReports.length}</p>
          <p className="text-sm text-emerald-700">Finalized report</p>
        </div>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-4 rounded-lg border-l-4 border-blue-300 bg-blue-50/40 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <h2 className="text-lg font-semibold">Verified reports</h2>
              <p className="text-sm text-muted-foreground">Reports ready for final approval.</p>
            </div>
            <div className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs ${statusPillClass["verified"]}`}>
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              {statusLabel["verified"]}
            </div>
          </div>
          <span className="rounded-full bg-blue-50/70 px-3 py-1 text-xs font-medium text-blue-700">{verifiedReports.length} waiting</span>
        </div>

        {verifiedReports.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground text-sm">
              No verified reports are waiting for approval.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {verifiedReports.map((r: Report & { departments: { name: string } | null }) => (
              <Card key={r.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">{r.reporting_period_name}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {r.departments?.name} · <span className="capitalize">{r.reporting_period}</span>
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center sm:gap-3">
                      <div className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs ${statusPillClass[r.status] ?? "border-muted/30 bg-muted/10 text-muted-foreground"}`}>
                        <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                        {statusLabel[r.status] ?? "Report status"}
                      </div>
                      <Badge variant={statusVariant[r.status] ?? "secondary"} className="capitalize">{r.status}</Badge>
                      <ReportStatusActions report={r} allowApprove />
                      <ExportReportButtons reportId={r.id} periodName={r.reporting_period_name} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  {r.outcome_progress && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Outcome Progress</p>
                      <p className="mt-0.5">{r.outcome_progress}</p>
                    </div>
                  )}
                  {r.key_results && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Key Results</p>
                      <p className="mt-0.5">{r.key_results}</p>
                    </div>
                  )}
                  {r.challenges && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Challenges</p>
                      <p className="mt-0.5">{r.challenges}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-4 rounded-lg border-l-4 border-emerald-300 bg-emerald-50/40 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <h2 className="text-lg font-semibold">Approved reports</h2>
              <p className="text-sm text-muted-foreground">Finalized reports for reference and export.</p>
            </div>
            <div className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs ${statusPillClass["approved"]}`}>
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              {statusLabel["approved"]}
            </div>
          </div>
          <span className="rounded-full bg-emerald-50/70 px-3 py-1 text-xs font-medium text-emerald-700">{approvedReports.length} approved</span>
        </div>

        {approvedReports.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground text-sm">
              No approved reports are available yet.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {approvedReports.map((r: Report & { departments: { name: string } | null }) => (
              <Card key={r.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">{r.reporting_period_name}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {r.departments?.name} · <span className="capitalize">{r.reporting_period}</span>
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center sm:gap-3">
                      <div className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs ${statusPillClass[r.status] ?? "border-muted/30 bg-muted/10 text-muted-foreground"}`}>
                        <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                        {statusLabel[r.status] ?? "Report status"}
                      </div>
                      <Badge variant={statusVariant[r.status] ?? "secondary"} className="capitalize">{r.status}</Badge>
                      <ExportReportButtons reportId={r.id} periodName={r.reporting_period_name} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  {r.outcome_progress && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Outcome Progress</p>
                      <p className="mt-0.5">{r.outcome_progress}</p>
                    </div>
                  )}
                  {r.key_results && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Key Results</p>
                      <p className="mt-0.5">{r.key_results}</p>
                    </div>
                  )}
                  {r.challenges && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Challenges</p>
                      <p className="mt-0.5">{r.challenges}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
