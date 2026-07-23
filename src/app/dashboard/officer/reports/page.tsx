import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ChevronRight } from "lucide-react";
import { ReportStatusActions } from "./report-status-actions";
import { ExportReportButtons } from "@/components/export-report-buttons";
import type { Report } from "@/lib/types";

const statusVariant: Record<string, "default" | "secondary" | "success" | "warning" | "destructive" | "outline"> = {
  draft: "secondary",
  submitted: "warning",
  reviewed: "outline",
  verified: "outline",
  approved: "success",
  rejected: "destructive",
  planned: "secondary",
  in_progress: "warning",
  completed: "success",
  delayed: "destructive",
  cancelled: "outline",
};

export default async function OfficerReportsPage() {
  const supabase = await createClient();

  const [
    { data: reports },
    { data: workPlans },
    { data: objectives },
    { data: outcomes },
    { data: outputs },
    { data: departments },
    { data: trainers },
  ] = await Promise.all([
    supabase.from("reports").select("*, departments(name)").order("created_at", { ascending: false }),
    supabase.from("work_plans").select("*").neq("status", "draft").order("created_at", { ascending: false }),
    supabase.from("strategic_objectives").select("id, code, title").order("code"),
    supabase.from("outcomes").select("id, strategic_objective_id, code, title").order("code"),
    supabase.from("outputs").select("id, outcome_id, code, title").order("code"),
    supabase.from("departments").select("id, name").order("name"),
    supabase.from("users").select("id, full_name, email, department_id").eq("role", "department_user"),
  ]);

  // Build planning framework tree
  const outcomesByObj: Record<string, typeof outcomes> = {};
  for (const oc of (outcomes ?? [])) {
    outcomesByObj[oc.strategic_objective_id] = [...(outcomesByObj[oc.strategic_objective_id] ?? []), oc];
  }
  const outputsByOutcome: Record<string, typeof outputs> = {};
  for (const op of (outputs ?? [])) {
    outputsByOutcome[op.outcome_id] = [...(outputsByOutcome[op.outcome_id] ?? []), op];
  }

  // Group work plans by department; list trainers in that dept alongside
  const deptWorkPlans = (departments ?? [])
    .map((dept) => ({
      dept,
      plans: (workPlans ?? []).filter((wp) => wp.department_id === dept.id),
      deptTrainers: (trainers ?? []).filter((u) => u.department_id === dept.id),
    }))
    .filter((d) => d.plans.length > 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Report</h1>
        <p className="text-sm text-muted-foreground mt-1">Review and approve department reports</p>
      </div>

      {/* ── Planning Framework ─────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold">Planning Framework</h2>
        {(!objectives || objectives.length === 0) ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No results framework defined yet.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {(objectives ?? []).map((obj) => (
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

      {/* ── Work Plans by Trainer ──────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold">Work Plans by Trainer</h2>
        {deptWorkPlans.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No submitted work plans yet.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {deptWorkPlans.map(({ dept, plans, deptTrainers }) => (
              <Card key={dept.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{dept.name}</CardTitle>
                  {deptTrainers.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Trainers: {deptTrainers.map((t) => t.full_name ?? t.email).join(", ")}
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="divide-y rounded-md border">
                    {plans.map((wp) => (
                      <div key={wp.id} className="px-3 py-2.5 flex items-center justify-between gap-2 text-sm">
                        <div>
                          <p className="font-medium">{wp.period_name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{wp.period_type} plan</p>
                        </div>
                        <Badge variant={statusVariant[wp.status] ?? "secondary"} className="capitalize shrink-0">
                          {wp.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <Separator />

      {/* ── Department Reports ─────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold">Department Reports</h2>
        {(!reports || reports.length === 0) ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No reports submitted yet.
            </CardContent>
          </Card>
        ) : (
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
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={statusVariant[r.status] ?? "secondary"} className="capitalize">{r.status}</Badge>
                      <ReportStatusActions report={r} />
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
        )}
      </section>
    </div>
  );
}
