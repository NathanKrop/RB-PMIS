import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, CheckCircle2, ShieldAlert, Copy, ClipboardCheck } from "lucide-react";
import { ResolveCheckButton } from "./resolve-button";
import { LogCheckButton } from "./log-check-button";
import type { DataQualityCheck } from "@/lib/types";

const severityVariant: Record<string, "destructive" | "warning" | "secondary"> = {
  high: "destructive",
  medium: "warning",
  low: "secondary",
};

const checkTypeIcon: Record<string, React.ReactNode> = {
  completeness: <ClipboardCheck className="h-4 w-4 text-blue-500" />,
  anomaly: <ShieldAlert className="h-4 w-4 text-amber-500" />,
  duplicate: <Copy className="h-4 w-4 text-purple-500" />,
};

const checkTypeLabel: Record<string, string> = {
  completeness: "Completeness",
  anomaly: "Anomaly",
  duplicate: "Duplicate",
};

export default async function DataQualityPage() {
  const supabase = await createClient();

  const [
    { data: departments },
    { data: activities },
    { data: reports },
    { data: indicators },
    { data: evidence },
    { data: existingChecks },
  ] = await Promise.all([
    supabase.from("departments").select("id, name").order("name"),
    supabase.from("activities").select("id, description, responsible_person, required_resources, anticipated_risks, mitigation_measures, start_date, end_date, status, department_id"),
    supabase.from("reports").select("id, reporting_period_name, outcome_progress, key_results, challenges, lessons_learned, department_id, status, created_at"),
    supabase.from("outcome_indicators").select("id, title, target, current_value, baseline"),
    supabase.from("evidence").select("id, title, file_path, uploaded_by, verification_status"),
    supabase.from("data_quality_checks").select("*, departments(name)").eq("resolved", false).order("created_at", { ascending: false }),
  ]);

  // ── Run checks ────────────────────────────────────────────────

  type Issue = { dept: string; deptId: string; type: "completeness" | "anomaly" | "duplicate"; entity: string; issue: string; severity: "low" | "medium" | "high" };
  const issues: Issue[] = [];

  const deptMap = Object.fromEntries((departments ?? []).map((d) => [d.id, d.name]));

  // 1. COMPLETENESS — activities missing key fields
  for (const a of activities ?? []) {
    const missing: string[] = [];
    if (!a.responsible_person) missing.push("responsible person");
    if (!a.required_resources) missing.push("required resources");
    if (!a.anticipated_risks) missing.push("anticipated risks");
    if (!a.mitigation_measures) missing.push("mitigation measures");
    if (missing.length > 0) {
      issues.push({
        dept: deptMap[a.department_id] ?? "Unknown",
        deptId: a.department_id,
        type: "completeness",
        entity: "Activity",
        issue: `"${a.description.slice(0, 60)}" is missing: ${missing.join(", ")}`,
        severity: missing.length >= 3 ? "high" : missing.length === 2 ? "medium" : "low",
      });
    }
  }

  // 2. COMPLETENESS — reports missing narrative fields
  for (const r of reports ?? []) {
    const missing: string[] = [];
    if (!r.outcome_progress) missing.push("outcome progress");
    if (!r.key_results) missing.push("key results");
    if (!r.challenges) missing.push("challenges");
    if (!r.lessons_learned) missing.push("lessons learned");
    if (missing.length > 0 && r.status !== "draft") {
      issues.push({
        dept: deptMap[r.department_id] ?? "Unknown",
        deptId: r.department_id,
        type: "completeness",
        entity: "Report",
        issue: `"${r.reporting_period_name}" is missing: ${missing.join(", ")}`,
        severity: missing.length >= 3 ? "high" : "medium",
      });
    }
  }

  // 3. ANOMALY — indicators with current_value > target (over-reporting)
  for (const i of indicators ?? []) {
    if (i.target > 0 && i.current_value > i.target * 1.5) {
      issues.push({
        dept: "All",
        deptId: "",
        type: "anomaly",
        entity: "Indicator",
        issue: `"${i.title}" current value (${i.current_value}) exceeds target (${i.target}) by more than 50%`,
        severity: "high",
      });
    }
  }

  // 4. ANOMALY — activities with end_date before start_date
  for (const a of activities ?? []) {
    if (a.start_date && a.end_date && a.end_date < a.start_date) {
      issues.push({
        dept: deptMap[a.department_id] ?? "Unknown",
        deptId: a.department_id,
        type: "anomaly",
        entity: "Activity",
        issue: `"${a.description.slice(0, 60)}" has end date before start date`,
        severity: "high",
      });
    }
  }

  // 5. ANOMALY — indicators with zero target
  for (const i of indicators ?? []) {
    if (i.target === 0) {
      issues.push({
        dept: "All",
        deptId: "",
        type: "anomaly",
        entity: "Indicator",
        issue: `"${i.title}" has a target of 0 — may be misconfigured`,
        severity: "medium",
      });
    }
  }

  // 6. DUPLICATE — reports with same period name in same department
  const reportKeys = new Map<string, number>();
  for (const r of reports ?? []) {
    const key = `${r.department_id}::${r.reporting_period_name.toLowerCase().trim()}`;
    reportKeys.set(key, (reportKeys.get(key) ?? 0) + 1);
  }
  for (const [key, count] of reportKeys.entries()) {
    if (count > 1) {
      const [deptId, period] = key.split("::");
      issues.push({
        dept: deptMap[deptId] ?? "Unknown",
        deptId,
        type: "duplicate",
        entity: "Report",
        issue: `${count} reports found for period "${period}" — possible duplicate submissions`,
        severity: "high",
      });
    }
  }

  // 7. DUPLICATE — evidence with same title uploaded multiple times
  const evidenceTitles = new Map<string, number>();
  for (const e of evidence ?? []) {
    const key = e.title.toLowerCase().trim();
    evidenceTitles.set(key, (evidenceTitles.get(key) ?? 0) + 1);
  }
  for (const [title, count] of evidenceTitles.entries()) {
    if (count > 1) {
      issues.push({
        dept: "All",
        deptId: "",
        type: "duplicate",
        entity: "Evidence",
        issue: `"${title}" uploaded ${count} times — possible duplicate evidence`,
        severity: "medium",
      });
    }
  }

  // Summary stats
  const totalIssues = issues.length;
  const highCount = issues.filter((i) => i.severity === "high").length;
  const unresolvedStored = (existingChecks ?? []).length;

  const byType = {
    completeness: issues.filter((i) => i.type === "completeness").length,
    anomaly: issues.filter((i) => i.type === "anomaly").length,
    duplicate: issues.filter((i) => i.type === "duplicate").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Data Quality</h1>
        <p className="text-sm text-muted-foreground mt-1">Completeness checks, anomaly detection, and duplicate detection</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Issues</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">{totalIssues}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">High Severity</CardTitle>
            <ShieldAlert className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent><p className="text-2xl font-bold text-destructive">{highCount}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Unresolved (Logged)</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">{unresolvedStored}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Departments Affected</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {new Set(issues.filter((i) => i.deptId).map((i) => i.deptId)).size}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Issue type breakdown */}
      <div className="grid grid-cols-3 gap-3">
        {(["completeness", "anomaly", "duplicate"] as const).map((type) => (
          <Card key={type}>
            <CardContent className="pt-4 pb-3 flex items-center gap-3">
              {checkTypeIcon[type]}
              <div>
                <p className="text-xs text-muted-foreground">{checkTypeLabel[type]}</p>
                <p className="text-xl font-bold">{byType[type]}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Live scan results */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold">Live Scan Results</h2>
        {issues.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
              No issues detected. Data quality looks good.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {issues.map((issue, i) => (
              <Card key={i} className={issue.severity === "high" ? "border-destructive/40" : issue.severity === "medium" ? "border-amber-400/40" : ""}>
                <CardContent className="py-3 px-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0">
                      {checkTypeIcon[issue.type]}
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-0.5">
                          <span className="text-xs font-medium">{issue.entity}</span>
                          <Badge variant={severityVariant[issue.severity]} className="text-xs capitalize">{issue.severity}</Badge>
                          <Badge variant="outline" className="text-xs">{checkTypeLabel[issue.type]}</Badge>
                          {issue.dept !== "All" && <span className="text-xs text-muted-foreground">{issue.dept}</span>}
                        </div>
                        <p className="text-sm text-muted-foreground">{issue.issue}</p>
                      </div>
                    </div>
                    <LogCheckButton check={{ departmentId: issue.deptId || null, checkType: issue.type, entity: issue.entity, issue: issue.issue, severity: issue.severity }} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Logged unresolved checks */}
      {(existingChecks ?? []).length > 0 && (
        <>
          <Separator />
          <section className="space-y-3">
            <h2 className="text-base font-semibold">Logged Issues</h2>
            <div className="space-y-2">
              {(existingChecks as (DataQualityCheck & { departments: { name: string } | null })[]).map((c) => (
                <Card key={c.id}>
                  <CardContent className="py-3 px-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5 min-w-0">
                        {checkTypeIcon[c.check_type]}
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-0.5">
                            <span className="text-xs font-medium">{c.entity}</span>
                            <Badge variant={severityVariant[c.severity]} className="text-xs capitalize">{c.severity}</Badge>
                            <Badge variant="outline" className="text-xs">{checkTypeLabel[c.check_type]}</Badge>
                            {c.departments?.name && <span className="text-xs text-muted-foreground">{c.departments.name}</span>}
                          </div>
                          <p className="text-sm text-muted-foreground">{c.issue}</p>
                        </div>
                      </div>
                      <ResolveCheckButton id={c.id} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
