import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ReportStatusActions } from "./report-status-actions";
import type { Report } from "@/lib/types";

const statusVariant: Record<string, "default" | "secondary" | "success" | "warning" | "destructive" | "outline"> = {
  draft: "secondary",
  submitted: "warning",
  reviewed: "outline",
  verified: "outline",
  approved: "success",
  rejected: "destructive",
};

export default async function OfficerReportsPage() {
  const supabase = await createClient();

  const { data: reports } = await supabase
    .from("reports")
    .select("*, departments(name)")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Reports</h1>
        <p className="text-sm text-muted-foreground mt-1">Review and approve department reports</p>
      </div>

      {(!reports || reports.length === 0) && (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground text-sm">
            No reports submitted yet.
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {(reports ?? []).map((r: Report & { departments: { name: string } | null }) => (
          <Card key={r.id}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base">{r.reporting_period_name}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {r.departments?.name} · <span className="capitalize">{r.reporting_period}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={statusVariant[r.status] ?? "secondary"} className="capitalize">{r.status}</Badge>
                  <ReportStatusActions report={r} />
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
              {r.lessons_learned && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Lessons Learned</p>
                  <p className="mt-0.5">{r.lessons_learned}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
