import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, TrendingUp, FileCheck, AlertTriangle } from "lucide-react";
import { DonutChart } from "@/components/charts/donut-chart";
import { SimpleBarChart } from "@/components/charts/bar-chart";
import { TrendLineChart } from "@/components/charts/line-chart";
import { DeadlineOverview } from "@/components/deadline-overview";
import type { Deadline } from "@/components/deadline-overview";
import type { ReportingDeadline } from "@/lib/types";
import { WorkPlanSubmissionStatus } from "./work-plan-submission-status";

const ACTIVITY_COLORS: Record<string, string> = {
  planned: "#94a3b8",
  in_progress: "#f59e0b",
  completed: "#22c55e",
  delayed: "#ef4444",
  cancelled: "#6b7280",
};

export default async function ManagementDashboard() {
  const supabase = await createClient();

  const [
    { count: objectiveCount },
    { count: approvedReports },
    { count: verifiedEvidence },
    { count: delayedActivities },
    { data: indicators },
    { data: activities },
    { data: outcomes },
    { data: outcomeIndicators },
    { data: reports },
    { data: departments },
    { data: workPlans },
    { data: reportChallenges },
    { data: dataQualityChecks },
    { data: trainers },
    { data: deadlines },
    { data: reportForDeadlines },
  ] = await Promise.all([
    supabase.from("strategic_objectives").select("*", { count: "exact", head: true }),
    supabase.from("reports").select("*", { count: "exact", head: true }).eq("status", "approved"),
    supabase.from("evidence").select("*", { count: "exact", head: true }).eq("verification_status", "verified"),
    supabase.from("activities").select("*", { count: "exact", head: true }).eq("status", "delayed"),
    supabase.from("outcome_indicators").select("title, target, current_value").order("created_at"),
    supabase.from("activities").select("status"),
    supabase.from("outcomes").select("id, title"),
    supabase.from("outcome_indicators").select("outcome_id, target, current_value"),
    supabase.from("reports").select("status, department_id, created_at").order("created_at"),
    supabase.from("departments").select("id, name").order("name"),
    supabase.from("work_plans").select("status, department_id, created_by, period_name, period_type, created_at").order("created_at", { ascending: false }),
    supabase.from("reports").select("challenges").not("challenges", "is", null),
    supabase.from("data_quality_checks").select("severity, resolved, check_type"),
    supabase.from("users").select("id, full_name, email, department_id, departments(name)").eq("role", "department_user").order("full_name"),
    supabase.from("reporting_deadlines").select("*, departments(name)").order("due_date"),
    supabase.from("reports").select("department_id, reporting_period_name").neq("status", "draft"),
  ]);

  // Indicator achievement % bar chart
  const indicatorBar = (indicators ?? [])
    .filter((i) => i.target > 0)
    .map((i) => ({
      name: i.title.length > 18 ? i.title.slice(0, 18) + "…" : i.title,
      value: Math.min(100, Math.round((i.current_value / i.target) * 100)),
      color: i.current_value >= i.target ? "#22c55e" : i.current_value / i.target >= 0.5 ? "#f59e0b" : "#ef4444",
    }));

  // Activity status donut
  const activityStatusCounts = (activities ?? []).reduce<Record<string, number>>((acc, a) => {
    acc[a.status] = (acc[a.status] ?? 0) + 1;
    return acc;
  }, {});
  const activityDonut = Object.entries(activityStatusCounts).map(([name, value]) => ({
    name: name.replace("_", " "),
    value,
    color: ACTIVITY_COLORS[name] ?? "#94a3b8",
  }));

  // Outcome achievement rates
  const outcomeAchievement = (outcomes ?? []).map((oc) => {
    const inds = (outcomeIndicators ?? []).filter((i) => i.outcome_id === oc.id);
    const avg = inds.length
      ? Math.min(100, Math.round(inds.reduce((s, i) => s + (i.target > 0 ? (i.current_value / i.target) * 100 : 0), 0) / inds.length))
      : 0;
    return {
      name: oc.title.length > 20 ? oc.title.slice(0, 20) + "…" : oc.title,
      value: avg,
      color: avg >= 75 ? "#22c55e" : avg >= 40 ? "#f59e0b" : "#ef4444",
    };
  }).filter((o) => o.value > 0);

  // Department comparison: approved reports vs total work plans
  const deptComparison = (departments ?? []).map((d) => ({
    name: d.name.length > 12 ? d.name.slice(0, 12) + "…" : d.name,
    "Approved Reports": (reports ?? []).filter((r) => r.department_id === d.id && r.status === "approved").length,
    "Work Plans": (workPlans ?? []).filter((w) => w.department_id === d.id).length,
  })).filter((d) => d["Approved Reports"] > 0 || d["Work Plans"] > 0);

  // Report submission trend by month (last 6 months)
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, label: d.toLocaleString("default", { month: "short" }) };
  });
  const reportTrend = months.map(({ key, label }) => ({
    name: label,
    Submitted: (reports ?? []).filter((r) => r.created_at?.startsWith(key) && r.status !== "draft").length,
    Approved: (reports ?? []).filter((r) => r.created_at?.startsWith(key) && r.status === "approved").length,
  }));

  // Recurring challenges: normalise semicolon, newline, and comma-separated entries.
  const challengeCounts = new Map<string, number>();
  for (const report of reportChallenges ?? []) {
    for (const challenge of (report.challenges ?? "").split(/[\n;,]+/)) {
      const label = challenge.trim().replace(/\.$/, "");
      if (label.length >= 4) challengeCounts.set(label, (challengeCounts.get(label) ?? 0) + 1);
    }
  }
  const recurringChallenges = [...challengeCounts.entries()]
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([name, value]) => ({ name: name.length > 28 ? `${name.slice(0, 28)}…` : name, value, color: "#f59e0b" }));

  const openQualityChecks = (dataQualityChecks ?? []).filter((check) => !check.resolved).length;
  const highQualityChecks = (dataQualityChecks ?? []).filter((check) => !check.resolved && check.severity === "high").length;


  // Enrich deadlines with submission status
  const reportPeriods = new Set(
    (reportForDeadlines ?? []).map((r) => r.department_id + "::" + r.reporting_period_name.toLowerCase().trim())
  );
  const enrichedDeadlines = (deadlines ?? []).map((d) => ({
    ...d,
    has_submission: reportPeriods.has(d.department_id + "::" + d.reporting_period_name.toLowerCase().trim()),
  }));
  const overdueDeadlines = enrichedDeadlines.filter((d) => !d.has_submission);

  const stats = [
    { label: "Strategic Objectives", value: objectiveCount ?? 0, icon: Target },
    { label: "Approved Reports", value: approvedReports ?? 0, icon: FileCheck },
    { label: "Verified Evidence", value: verifiedEvidence ?? 0, icon: TrendingUp },
    { label: "Delayed Activities", value: delayedActivities ?? 0, icon: AlertTriangle },
    { label: "Open Data Quality Issues", value: openQualityChecks, icon: AlertTriangle },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Management Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Consolidated strategic performance overview</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
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

      {overdueDeadlines.length > 0 && (
        <DeadlineOverview deadlines={overdueDeadlines} compact title="Overdue & Upcoming Deadlines" />
      )}

      <WorkPlanSubmissionStatus trainers={trainers ?? []} workPlans={workPlans ?? []} />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Indicator Achievement (%)</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleBarChart data={indicatorBar} valueLabel="% Achieved" color="#22c55e" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Activity Status Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <DonutChart data={activityDonut} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Outcome Achievement Rates (%)</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleBarChart data={outcomeAchievement} valueLabel="% Achieved" color="#6366f1" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Report Submission Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <TrendLineChart
              data={reportTrend}
              lines={[
                { key: "Submitted", label: "Submitted", color: "#f59e0b" },
                { key: "Approved", label: "Approved", color: "#22c55e" },
              ]}
            />
          </CardContent>
        </Card>
      </div>

      {deptComparison.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Department Performance Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <TrendLineChart
              data={deptComparison}
              lines={[
                { key: "Approved Reports", label: "Approved Reports", color: "#22c55e" },
                { key: "Work Plans", label: "Work Plans", color: "#6366f1" },
              ]}
            />
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Recurring Challenges</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleBarChart data={recurringChallenges} valueLabel="Reports" color="#f59e0b" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Data Quality Snapshot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-3xl font-bold">{openQualityChecks}</p>
            <p className="text-sm text-muted-foreground">Open validation issues across the organisation</p>
            <p className="text-sm"><span className="font-medium text-destructive">{highQualityChecks}</span> high-severity issue{highQualityChecks === 1 ? "" : "s"} need attention.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
