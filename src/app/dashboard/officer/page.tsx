import { createClient } from "@/lib/supabase/server";
import { DeadlineOverview } from "@/components/deadline-overview";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, FileText, Upload, BarChart2 } from "lucide-react";
import { DonutChart } from "@/components/charts/donut-chart";
import { SimpleBarChart } from "@/components/charts/bar-chart";
import { TrendLineChart } from "@/components/charts/line-chart";
import { DataFreshnessCard } from "@/components/data-freshness-card";

const EVIDENCE_COLORS: Record<string, string> = {
  pending: "#f59e0b",
  verified: "#22c55e",
  requires_clarification: "#60a5fa",
  rejected: "#ef4444",
};

const REPORT_STATUS_COLORS: Record<string, string> = {
  draft: "#94a3b8",
  submitted: "#f59e0b",
  reviewed: "#60a5fa",
  verified: "#818cf8",
  approved: "#22c55e",
  rejected: "#ef4444",
};

export default async function OfficerDashboard() {
  const supabase = await createClient();

  const [
    { count: deptCount },
    { count: pendingReports },
    { count: pendingEvidence },
    { count: objectiveCount },
    { data: allReports },
    { data: allEvidence },
    { data: departments },
    { data: workPlans },
    { data: activities },
    { data: deadlines },
    { data: reportForDeadlines },
    { count: unresolvedQualityChecks },
    { count: totalQualityChecks },
    { data: latestReport },
    { data: latestActivity },
    { data: latestEvidence },
    { data: latestDeadline },
  ] = await Promise.all([
    supabase.from("departments").select("*", { count: "exact", head: true }),
    supabase.from("reports").select("*", { count: "exact", head: true }).eq("status", "submitted"),
    supabase.from("evidence").select("*", { count: "exact", head: true }).eq("verification_status", "pending"),
    supabase.from("strategic_objectives").select("*", { count: "exact", head: true }),
    supabase.from("reports").select("status, department_id, created_at").order("created_at"),
    supabase.from("evidence").select("verification_status"),
    supabase.from("departments").select("id, name").order("name"),
    supabase.from("work_plans").select("status, department_id"),
    supabase.from("activities").select("status, department_id"),
    supabase.from("reporting_deadlines").select("*, departments(name)").order("due_date"),
    supabase.from("reports").select("department_id, reporting_period_name").neq("status", "draft"),
    supabase.from("data_quality_checks").select("*", { count: "exact", head: true }).eq("resolved", false),
    supabase.from("data_quality_checks").select("*", { count: "exact", head: true }),
    supabase.from("reports").select("updated_at").order("updated_at", { ascending: false }).limit(1).single(),
    supabase.from("activities").select("updated_at").order("updated_at", { ascending: false }).limit(1).single(),
    supabase.from("evidence").select("updated_at").order("updated_at", { ascending: false }).limit(1).single(),
    supabase.from("reporting_deadlines").select("updated_at").order("updated_at", { ascending: false }).limit(1).single(),
  ]);

  // Reports per department
  const reportsByDept = (departments ?? []).map((d) => ({
    name: d.name.length > 14 ? d.name.slice(0, 14) + "…" : d.name,
    value: (allReports ?? []).filter((r) => r.department_id === d.id).length,
  })).filter((d) => d.value > 0);

  // Evidence by verification status donut
  const evidenceStatusCounts = (allEvidence ?? []).reduce<Record<string, number>>((acc, e) => {
    acc[e.verification_status] = (acc[e.verification_status] ?? 0) + 1;
    return acc;
  }, {});
  const evidenceDonut = Object.entries(evidenceStatusCounts).map(([name, value]) => ({
    name: name.replace(/_/g, " "),
    value,
    color: EVIDENCE_COLORS[name] ?? "#94a3b8",
  }));

  // Report status breakdown donut
  const reportStatusCounts = (allReports ?? []).reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});
  const reportStatusDonut = Object.entries(reportStatusCounts).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    color: REPORT_STATUS_COLORS[name] ?? "#94a3b8",
  }));

  // Department submission rate: submitted+approved reports vs total
  const deptSubmissionRate = (departments ?? []).map((d) => {
    const total = (allReports ?? []).filter((r) => r.department_id === d.id).length;
    const submitted = (allReports ?? []).filter((r) => r.department_id === d.id && ["submitted", "reviewed", "verified", "approved"].includes(r.status)).length;
    return {
      name: d.name.length > 12 ? d.name.slice(0, 12) + "…" : d.name,
      value: total > 0 ? Math.round((submitted / total) * 100) : 0,
      color: submitted / (total || 1) >= 0.75 ? "#22c55e" : submitted / (total || 1) >= 0.4 ? "#f59e0b" : "#ef4444",
    };
  }).filter((d) => d.value > 0);
  // Enrich deadlines with submission status
  const reportPeriods = new Set(
    (reportForDeadlines ?? []).map((r) => r.department_id + "::" + r.reporting_period_name.toLowerCase().trim())
  );
  const enrichedDeadlines = (deadlines ?? []).map((d) => ({
    ...d,
    has_submission: reportPeriods.has(d.department_id + "::" + d.reporting_period_name.toLowerCase().trim()),
  }));
  const overdueDeadlines = enrichedDeadlines.filter((d) => !d.has_submission);



  // Work plan status per department
  const deptWorkPlanComparison = (departments ?? []).map((d) => ({
    name: d.name.length > 12 ? d.name.slice(0, 12) + "…" : d.name,
    Approved: (workPlans ?? []).filter((w) => w.department_id === d.id && w.status === "approved").length,
    Submitted: (workPlans ?? []).filter((w) => w.department_id === d.id && w.status === "submitted").length,
    Draft: (workPlans ?? []).filter((w) => w.department_id === d.id && w.status === "draft").length,
  })).filter((d) => d.Approved + d.Submitted + d.Draft > 0);

  // Activity completion rate per department
  const deptActivityRate = (departments ?? []).map((d) => {
    const total = (activities ?? []).filter((a) => a.department_id === d.id).length;
    const completed = (activities ?? []).filter((a) => a.department_id === d.id && a.status === "completed").length;
    return {
      name: d.name.length > 12 ? d.name.slice(0, 12) + "…" : d.name,
      value: total > 0 ? Math.round((completed / total) * 100) : 0,
      color: completed / (total || 1) >= 0.75 ? "#22c55e" : completed / (total || 1) >= 0.4 ? "#f59e0b" : "#ef4444",
    };
  }).filter((d) => d.value > 0);

  const freshnessTimestamps = [latestReport?.updated_at, latestActivity?.updated_at, latestEvidence?.updated_at, latestDeadline?.updated_at].filter(Boolean) as string[];
  const latestUpdatedAt = freshnessTimestamps.length > 0 ? freshnessTimestamps.sort().reverse()[0] : null;
  const qualityErrorRate = totalQualityChecks && totalQualityChecks > 0
    ? Math.round(((unresolvedQualityChecks ?? 0) / totalQualityChecks) * 100)
    : 0;

  const stats = [
    { label: "Departments", value: deptCount ?? 0, icon: Building2 },
    { label: "Pending Reports", value: pendingReports ?? 0, icon: FileText },
    { label: "Evidence to Review", value: pendingEvidence ?? 0, icon: Upload },
    { label: "Strategic Objectives", value: objectiveCount ?? 0, icon: BarChart2 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Reporting Officer Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Overview of all departments and submissions</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <DataFreshnessCard updatedAt={latestUpdatedAt} />
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">On-time Reporting Compliance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {enrichedDeadlines.length === 0 ? "100%" : `${Math.max(0, 100 - Math.round((overdueDeadlines.length / enrichedDeadlines.length) * 100))}%`}
            </p>
            <p className="text-sm text-muted-foreground mt-1">Deadlines met across departments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Work Plan Coverage</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{deptWorkPlanComparison.length}</p>
            <p className="text-sm text-muted-foreground mt-1">Departments with work plan tracking</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Data Quality Error Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{qualityErrorRate}%</p>
            <p className="text-sm text-muted-foreground mt-1">Unresolved issues fraction</p>
          </CardContent>
        </Card>
      </div>

      {overdueDeadlines.length > 0 && (
        <DeadlineOverview deadlines={overdueDeadlines} compact title="Overdue & Upcoming Deadlines" />
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Reports by Department</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleBarChart data={reportsByDept} valueLabel="Reports" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Evidence Verification Status</CardTitle>
          </CardHeader>
          <CardContent>
            <DonutChart data={evidenceDonut} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Report Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <DonutChart data={reportStatusDonut} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Department Submission Rate (%)</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleBarChart data={deptSubmissionRate} valueLabel="% Submitted" color="#6366f1" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Activity Completion Rate by Department (%)</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleBarChart data={deptActivityRate} valueLabel="% Completed" color="#22c55e" />
          </CardContent>
        </Card>
        {deptWorkPlanComparison.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Work Plan Status by Department</CardTitle>
            </CardHeader>
            <CardContent>
              <TrendLineChart
                data={deptWorkPlanComparison}
                lines={[
                  { key: "Approved", label: "Approved", color: "#22c55e" },
                  { key: "Submitted", label: "Submitted", color: "#f59e0b" },
                  { key: "Draft", label: "Draft", color: "#94a3b8" },
                ]}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
