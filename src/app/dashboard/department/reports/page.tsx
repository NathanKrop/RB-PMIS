import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ChevronRight } from "lucide-react";
import { ReportForm } from "./report-form";
import { ReportActions } from "./report-actions";
import { ExportReportButtons } from "@/components/export-report-buttons";
import type { Report } from "@/lib/types";

const statusVariant: Record<string, "default" | "secondary" | "success" | "warning" | "destructive" | "outline"> = {
  draft: "secondary",
  submitted: "warning",
  reviewed: "outline",
  verified: "outline",
  approved: "success",
  rejected: "destructive",
};

export default async function ReportsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("users").select("department_id").eq("id", user!.id).single();
  const deptId = profile?.department_id;

  const [
    { data: reports },
    { data: objectives },
    { data: outcomes },
    { data: outputs },
    { data: activities },
  ] = await Promise.all([
    supabase.from("reports").select("*").eq("department_id", deptId).order("created_at", { ascending: false }),
    supabase.from("strategic_objectives").select("id, code, title").order("code"),
    supabase.from("outcomes").select("id, strategic_objective_id, code, title").order("code"),
    supabase.from("outputs").select("id, outcome_id, code, title").order("code"),
    supabase.from("activities").select("output_id, status").eq("department_id", deptId),
  ]);

  // Only show objectives/outcomes/outputs that this dept has activities under
  const deptOutputIds = new Set((activities ?? []).map((a) => a.output_id));
  const deptOutcomeIds = new Set(
    (outputs ?? []).filter((op) => deptOutputIds.has(op.id)).map((op) => op.outcome_id)
  );
  const deptObjectiveIds = new Set(
    (outcomes ?? []).filter((oc) => deptOutcomeIds.has(oc.id)).map((oc) => oc.strategic_objective_id)
  );

  const filteredObjectives = (objectives ?? []).filter((obj) => deptObjectiveIds.has(obj.id));
  const outcomesByObj: Record<string, typeof outcomes> = {};
  for (const oc of (outcomes ?? []).filter((oc) => deptOutcomeIds.has(oc.id))) {
    outcomesByObj[oc.strategic_objective_id] = [...(outcomesByObj[oc.strategic_objective_id] ?? []), oc];
  }
  const outputsByOutcome: Record<string, typeof outputs> = {};
  for (const op of (outputs ?? []).filter((op) => deptOutputIds.has(op.id))) {
    outputsByOutcome[op.outcome_id] = [...(outputsByOutcome[op.outcome_id] ?? []), op];
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Report</h1>
          <p className="text-sm text-muted-foreground mt-1">Submit and track your periodic performance reports</p>
        </div>
        <ReportForm />
      </div>

      {/* ── Planning Framework ─────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold">Planning Framework</h2>
        {filteredObjectives.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No framework linked to your department yet.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredObjectives.map((obj) => (
              <Card key={obj.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{obj.code}</span>
                    <CardTitle className="text-sm">{obj.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {(outcomesByObj[obj.id] ?? []).map((oc) => (
                    <div key={oc.id} className="pl-3 border-l-2 border-muted space-y-1.5">
                      <div className="flex items-center gap-2 text-sm">
                        <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span className="text-xs font-mono text-muted-foreground">{oc.code}</span>
                        <span className="font-medium">{oc.title}</span>
                      </div>
                      {(outputsByOutcome[oc.id] ?? []).map((op) => (
                        <div key={op.id} className="pl-5 flex items-center gap-2 text-xs text-muted-foreground">
                          <ChevronRight className="h-3 w-3 shrink-0" />
                          <span className="font-mono">{op.code}</span>
                          <span>{op.title}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <Separator />

      {/* ── Reports ───────────────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold">My Reports</h2>
        {(!reports || reports.length === 0) ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No reports yet. Create your first report.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {(reports ?? []).map((r: Report) => (
              <Card key={r.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">{r.reporting_period_name}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5 capitalize">{r.reporting_period} report</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={statusVariant[r.status] ?? "secondary"} className="capitalize">{r.status}</Badge>
                      <ReportActions report={r} />
                      <ExportReportButtons reportId={r.id} periodName={r.reporting_period_name} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
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
                  {r.next_period_priorities && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Next Period Priorities</p>
                      <p className="mt-0.5">{r.next_period_priorities}</p>
                    </div>
                  )}
                  {r.status === "rejected" && r.rejection_reason && (
                    <div className="rounded-md border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
                      <p className="text-xs font-medium uppercase tracking-wide">Rejection Comment</p>
                      <p className="mt-1 whitespace-pre-line">{r.rejection_reason}</p>
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
