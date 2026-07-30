import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Activity, Department, Output } from "@/lib/types";
import { Breadcrumb, BreadcrumbItem } from "@/components/ui/breadcrumb";

const statusVariant: Record<string, "default" | "secondary" | "success" | "warning" | "destructive" | "outline"> = {
  planned: "secondary", in_progress: "warning", completed: "success", delayed: "destructive", cancelled: "outline",
};

export default async function ManagementActivitiesPage() {
  const supabase = await createClient();
  const [{ data: activities }, { data: departments }, { data: outputs }] = await Promise.all([
    supabase.from("activities").select("*").order("start_date", { ascending: false }),
    supabase.from("departments").select("*").order("name"),
    supabase.from("outputs").select("*").order("code"),
  ]);
  const departmentById = new Map((departments ?? []).map((department: Department) => [department.id, department.name]));
  const outputById = new Map((outputs ?? []).map((output: Output) => [output.id, output]));

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumb compact className="mb-3">
          <BreadcrumbItem current>Activities</BreadcrumbItem>
        </Breadcrumb>
        <h1 className="text-2xl font-semibold">Activities</h1>
        <p className="mt-1 text-sm text-muted-foreground">View activity delivery and implementation status across departments</p>
      </div>
      {!activities?.length ? (
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">No activities have been added.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {activities.map((activity: Activity) => {
            const output = outputById.get(activity.output_id);
            return (
              <Card key={activity.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <div><CardTitle className="text-base">{activity.description}</CardTitle><p className="mt-1 text-xs text-muted-foreground">{departmentById.get(activity.department_id) ?? "Department unavailable"}</p></div>
                    <Badge variant={statusVariant[activity.status] ?? "secondary"} className="capitalize">{activity.status.replace("_", " ")}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-2 text-sm sm:grid-cols-3">
                  <p><span className="text-muted-foreground">Output: </span>{output ? `${output.code} — ${output.title}` : "Not available"}</p>
                  <p><span className="text-muted-foreground">Period: </span>{activity.start_date} to {activity.end_date}</p>
                  <p><span className="text-muted-foreground">Responsible: </span>{activity.responsible_person ?? "Not assigned"}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
