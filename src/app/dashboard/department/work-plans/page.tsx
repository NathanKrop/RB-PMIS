import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb, BreadcrumbItem } from "@/components/ui/breadcrumb";
import { WorkPlanForm } from "./work-plan-form";
import { ActivityForm } from "./activity-form";
import { WorkPlanActions } from "./work-plan-actions";
import type { WorkPlan, Activity } from "@/lib/types";

type ActivityWithOutput = Activity & { outputs: { code: string } | null };

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

export default async function WorkPlansPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase.from("users").select("department_id").eq("id", user!.id).single();
  const deptId = profile?.department_id;

  const [{ data: workPlans }, { data: activities }, { data: outputs }] = await Promise.all([
    supabase.from("work_plans").select("*").eq("department_id", deptId).order("created_at", { ascending: false }),
    supabase.from("activities").select("*, outputs(code, title, outcomes(title, strategic_objectives(title)))").eq("department_id", deptId).order("created_at", { ascending: false }),
    supabase.from("outputs").select("id, code, title, outcome_id").order("code"),
  ]);

  const activitiesByPlan: Record<string, ActivityWithOutput[]> = {};
  const unlinked: ActivityWithOutput[] = [];
  for (const a of (activities ?? []) as ActivityWithOutput[]) {
    if (a.work_plan_id) {
      activitiesByPlan[a.work_plan_id] = [...(activitiesByPlan[a.work_plan_id] ?? []), a];
    } else {
      unlinked.push(a);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Breadcrumb compact className="mb-3">
            <BreadcrumbItem current>Work Plans</BreadcrumbItem>
          </Breadcrumb>
          <h1 className="text-2xl font-semibold">Work Plans</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your department&apos;s work plans and activities</p>
        </div>
        <WorkPlanForm />
      </div>

      {(!workPlans || workPlans.length === 0) && (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground text-sm">
            No work plans yet. Create your first work plan to get started.
          </CardContent>
        </Card>
      )}

      {(workPlans ?? []).map((wp: WorkPlan) => (
        <Card key={wp.id}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle className="text-base">{wp.period_name}</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5 capitalize">{wp.period_type} plan</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={statusVariant[wp.status] ?? "secondary"} className="capitalize">{wp.status}</Badge>
                <WorkPlanActions workPlan={wp} />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {(activitiesByPlan[wp.id] ?? []).length === 0 ? (
              <p className="text-xs text-muted-foreground">No activities linked to this work plan.</p>
            ) : (
              <div className="divide-y rounded-md border">
                {(activitiesByPlan[wp.id] ?? []).map((a) => (
                  <div key={a.id} className="px-3 py-2.5 text-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{a.description}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {a.outputs?.code} · {a.start_date} → {a.end_date}
                          {a.responsible_person && ` · ${a.responsible_person}`}
                        </p>
                      </div>
                      <Badge variant={statusVariant[a.status] ?? "secondary"} className="capitalize shrink-0">{a.status.replace("_", " ")}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {wp.status === "draft" && (
              <ActivityForm workPlanId={wp.id} outputs={outputs ?? []} />
            )}
          </CardContent>
        </Card>
      ))}

      {unlinked.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Unlinked Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y rounded-md border">
              {unlinked.map((a) => (
                <div key={a.id} className="px-3 py-2.5 text-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{a.description}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{a.start_date} → {a.end_date}</p>
                    </div>
                    <Badge variant={statusVariant[a.status] ?? "secondary"} className="capitalize shrink-0">{a.status.replace("_", " ")}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Add Standalone Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityForm outputs={outputs ?? []} />
        </CardContent>
      </Card>
    </div>
  );
}
