import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Department, StrategicObjective } from "@/lib/types";

export default async function ManagementObjectivesPage() {
  const supabase = await createClient();
  const [{ data: objectives }, { data: departments }] = await Promise.all([
    supabase.from("strategic_objectives").select("*").order("code"),
    supabase.from("departments").select("*").order("name"),
  ]);
  const departmentById = new Map((departments ?? []).map((department: Department) => [department.id, department.name]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Strategic Objectives</h1>
        <p className="mt-1 text-sm text-muted-foreground">Organisation-wide strategic objectives and responsible departments</p>
      </div>
      {!objectives?.length ? (
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">No strategic objectives have been defined.</CardContent></Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {objectives.map((objective: StrategicObjective) => (
            <Card key={objective.id}>
              <CardHeader className="pb-2">
                <p className="font-mono text-xs text-muted-foreground">{objective.code}</p>
                <CardTitle className="text-base">{objective.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {objective.description && <p className="text-muted-foreground">{objective.description}</p>}
                <p><span className="text-muted-foreground">Responsible department: </span>{objective.responsible_department_id ? departmentById.get(objective.responsible_department_id) ?? "Not available" : "Not assigned"}</p>
                <p><span className="text-muted-foreground">Reporting frequency: </span>{objective.reporting_frequency ?? "Not set"}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
