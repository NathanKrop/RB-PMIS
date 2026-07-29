import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, FileText, Upload, CheckCircle2 } from "lucide-react";
import { DonutChart } from "@/components/charts/donut-chart";
import { SimpleBarChart } from "@/components/charts/bar-chart";
import { DeadlineOverview } from "@/components/deadline-overview";
import { EvidenceCompletenessOverview } from "@/components/evidence-completeness";
import { DataFreshnessCard } from "@/components/data-freshness-card";
import type { Deadline } from "@/components/deadline-overview";
import type { ReportingDeadline } from "@/lib/types";

const ACTIVITY_COLORS: Record<string, string> = {
  planned: "#94a3b8",
  in_progress: "#f59e0b",
  completed: "#22c55e",
  delayed: "#ef4444",
  cancelled: "#6b7280",
};

const REPORT_COLORS: Record<string, string> = {
  draft: "#94a3b8",
  submitted: "#f59e0b",
  reviewed: "#60a5fa",
  verified: "#818cf8",
  approved: "#22c55e",
  rejected: "#ef4444",
};

export default async function DepartmentDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("users")
    .select("*, departments(name)")
    .eq("id", user!.id)
    .single();

  const deptId = profile?.department_id;

  const [
    { data: activities },
    { data: reports },
    { count: evidenceCount },
    { count: completedCount },
    { count: workPlanCount },
    { data: indicators },
    { data: deadlines },
    { data: allReports },
    { data: latestActivity },
    { data: latestReport },
    { data: latestEvidence },
    { data: latestWorkPlan },
    { count: unresolvedDataQualityChecks },
  ] = await Promise.all([
    supabase.from("activities").select("id, status").eq("department_id", deptId),
    supabase.from("reports").select("status").eq("department_id", deptId),
    supabase.from("evidence").select("*", { count: "exact", head: true }).eq("department_id", deptId),
    supabase.from("activities").select("*", { count: "exact", head: true }).eq("department_id", deptId).eq("status", "completed"),
    supabase.from("work_plans").select("*", { count: "exact", head: true }).eq("department_id", deptId),
    supabase.from("indicators").select("title, target, current_value, activity_id, activities!inner(department_id)").eq("activities.department_id", deptId),
    supabase.from("reporting_deadlines").select("*, departments(name)").eq("department_id", deptId).order("due_date"),
    supabase.from("reports").select("department_id, reporting_period_name").eq("department_id", deptId).neq("status", "draft"),
    supabase.from("activities").select("updated_at").eq("department_id", deptId).order("updated_at", { ascending: false }).limit(1).single(),
    supabase.from("reports").select("updated_at").eq("department_id", deptId).order("updated_at", { ascending: false }).limit(1).single(),
    supabase.from("evidence").select("updated_at").eq("department_id", deptId).order("updated_at", { ascending: false }).limit(1).single(),
    supabase.from("work_plans").select("updated_at").eq("department_id", deptId).order("updated_at", { ascending: false }).limit(1).single(),
    supabase.from("data_quality_checks").select("*", { count: "exact", head: true }).eq("department_id", deptId).eq("resolved", false),
  ]);

  const reportPeriods = new Set(
    (allReports ?? []).map((r) => `${r.department_id}::${r.reporting_period_name.toLowerCase().trim()}`)
  );

  const enrichedDeadlines: Deadline[] = (deadlines ?? []).map((d: ReportingDeadline & { departments: { name: string } | null }) => ({
    ...d,
    has_submission: reportPeriods.has(`${d.department_id}::${d.reporting_period_name.toLowerCase().trim()}`),
  }));

  const pendingDeadlines = enrichedDeadlines.filter((d) => !d.has_submission);

  const completedActivityIds = (activities ?? []).filter((a) => a.status === "completed").map((a) => a.id);
  const completedActivityEvidenceCount = completedActivityIds.length > 0
    ? await supabase.from("evidence").select("*", { count: "exact", head: true }).in("activity_id", completedActivityIds).then((res) => res.count ?? 0)
    : 0;
  const evidenceCompletenessRate = completedActivityIds.length > 0
    ? Math.round((completedActivityEvidenceCount / completedActivityIds.length) * 100)
    : 0;
  const openQualityChecks = unresolvedDataQualityChecks ?? 0;

  const freshnessTimestamps = [latestActivity?.updated_at, latestReport?.updated_at, latestEvidence?.updated_at, latestWorkPlan?.updated_at].filter(Boolean) as string[];
  const latestUpdatedAt = freshnessTimestamps.length > 0 ? freshnessTimestamps.sort().reverse()[0] : null;

  const activityStatusCounts = (activities ?? []).reduce<Record<string, number>>((acc, a) => {
    acc[a.status] = (acc[a.status] ?? 0) + 1;
    return acc;
  }, {});

  const activityDonut = Object.entries(activityStatusCounts).map(([name, value]) => ({
    name: name.replace("_", " "),
    value,
    color: ACTIVITY_COLORS[name] ?? "#94a3b8",
  }));

  const reportBar = Object.entries(
    (reports ?? []).reduce<Record<string, number>>((acc, r) => {
      acc[r.status] = (acc[r.status] ?? 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    color: REPORT_COLORS[name] ?? "#94a3b8",
  }));

  // Indicator progress bars
  const indicatorProgress = (indicators ?? [])
    .filter((i) => i.target > 0)
    .map((i) => ({
      name: i.title.length > 20 ? i.title.slice(0, 20) + "..." : i.title,
      value: Math.min(100, Math.round((i.current_value / i.target) * 100)),
      color: i.current_value >= i.target ? "#22c55e" : i.current_value / i.target >= 0.5 ? "#f59e0b" : "#ef4444",
    }));

  // Activity completion rate
  const totalActivities = (activities ?? []).length;
  const completionRate = totalActivities > 0
    ? Math.round(((completedCount ?? 0) / totalActivities) * 100)
    : 0;

  const stats = [
    { label: "Work Plans", value: workPlanCount ?? 0, icon: ClipboardList },
    { label: "Reports", value: (reports ?? []).length, icon: FileText },
    { label: "Evidence Files", value: evidenceCount ?? 0, icon: Upload },
    { label: "Completed Activities", value: completedCount ?? 0, icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Welcome, {profile?.full_name ?? "User"}</h1>
        <p className="text-muted-foreground text-sm mt-1">{profile?.departments?.name}</p>
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

      <div className="grid gap-4 lg:grid-cols-4">
        <DataFreshnessCard updatedAt={latestUpdatedAt} />
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Evidence Completeness Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{evidenceCompletenessRate}%</p>
            <p className="text-sm text-muted-foreground mt-1">Completed activities with evidence</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">On-time reporting compliance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{pendingDeadlines.length === 0 ? "100%" : `${Math.max(0, 100 - Math.round((pendingDeadlines.length / (enrichedDeadlines.length || 1)) * 100))}%`}</p>
            <p className="text-sm text-muted-foreground mt-1">Reports submitted before deadline</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Open Data Quality Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{openQualityChecks}</p>
            <p className="text-sm text-muted-foreground mt-1">Unresolved departmental checks</p>
          </CardContent>
        </Card>
      </div>

      {/* Deadline overview widget */}
      {pendingDeadlines.length > 0 && (
        <DeadlineOverview deadlines={pendingDeadlines} compact title="My Upcoming Deadlines" />
      )}

      {/* Evidence completeness */}
      <EvidenceCompletenessOverview items={[{reportName:"Current Period",reportPeriod:reports?.[0]?.status||"draft",departmentName:profile?.departments?.name||"",evidenceCount:evidenceCount??0,hasEvidence:(evidenceCount??0)>0}]} compact />

      {/* Activity completion rate */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Activity Completion Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
              <div
                className="h-3 rounded-full transition-all"
                style={{
                  width: `${completionRate}%`,
                  backgroundColor: completionRate >= 75 ? "#22c55e" : completionRate >= 40 ? "#f59e0b" : "#ef4444",
                }}
              />
            </div>
            <span className="text-sm font-semibold w-12 text-right">{completionRate}%</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{completedCount ?? 0} of {totalActivities} activities completed</p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Activity Status</CardTitle>
          </CardHeader>
          <CardContent>
            <DonutChart data={activityDonut} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Reports by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleBarChart data={reportBar} valueLabel="Reports" />
          </CardContent>
        </Card>
      </div>

      {indicatorProgress.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Indicator Progress (%)</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleBarChart data={indicatorProgress} valueLabel="% Achieved" color="#6366f1" />
          </CardContent>
        </Card>
      )}
    </div>
  );
}