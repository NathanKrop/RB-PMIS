import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb, BreadcrumbItem } from "@/components/ui/breadcrumb";
import { WorkPlanActions } from "../work-plan-actions";
import { ActivityForm } from "../activity-form";
import type { WorkPlan, Activity } from "@/lib/types";

const statusVariant: Record<string, "default" | "secondary" | "success" | "warning" | "destructive" | "outline"> = {
  draft: "secondary",
  submitted: "warning",
  approved: "success",
  rejected: "destructive",
  planned: "secondary",
  in_progress: "warning",
  completed: "success",
  delayed: "destructive",
  cancelled: "outline",
};

type ActivityWithOutput = Activity & { outputs: { code: string } | null };

export default async function WorkPlanDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("users").select("department_id").eq("id", user!.id).single();
  const deptId = profile?.department_id;

  const [{ data: workPlan }, { data: activities }, { data: outputs }] = await Promise.all([
    supabase.from("work_plans").select("*").eq("id", params.id).eq("department_id", deptId).single(),
    supabase.from("activities").select("*, outputs(code, title)").eq("work_plan_id", params.id).eq("department_id", deptId).order("created_at", { ascending: false }),
    supabase.from("outputs").select("id, code, title, outcome_id").order("code"),
  ]);

  if (!workPlan) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground text-sm">
            Work plan not found or you do not have access to view it.
          </CardContent>
        </Card>
      </div>
    );
  }

  const planActivities = (activities ?? []) as ActivityWithOutput[];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Breadcrumb compact>
            <BreadcrumbItem href="/dashboard/department/reports">Reports</BreadcrumbItem>
            <BreadcrumbItem href="/dashboard/department/work-plans">Work Plans</BreadcrumbItem>
            <BreadcrumbItem current>{workPlan.period_name}</BreadcrumbItem>
          </Breadcrumb>
          <h1 className="text-2xl font-semibold">{workPlan.period_name}</h1>
          <p className="text-sm text-muted-foreground mt-1 capitalize">{workPlan.period_type} work plan</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={statusVariant[workPlan.status] ?? "secondary"} className="capitalize">
            {workPlan.status}
          </Badge>
          <WorkPlanActions workPlan={workPlan} />
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Activities</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {planActivities.length === 0 ? (
            <p className="text-xs text-muted-foreground">No activities are linked to this plan yet.</p>
          ) : (
            <div className="divide-y rounded-md border">
              {planActivities.map((activity) => (
                <div key={activity.id} className="px-3 py-2.5 text-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{activity.description}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {activity.outputs?.code} · {activity.start_date} → {activity.end_date}
                        {activity.responsible_person && ` · ${activity.responsible_person}`}
                      </p>
                    </div>
                    <Badge variant={statusVariant[activity.status] ?? "secondary"} className="capitalize shrink-0">
                      {activity.status.replace("_", " ")}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter>
          {workPlan.status === "draft" && <ActivityForm workPlanId={workPlan.id} outputs={outputs ?? []} />}
        </CardFooter>
      </Card>
    </div>
  );
}
