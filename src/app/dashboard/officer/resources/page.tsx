import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SimpleBarChart } from "@/components/charts/bar-chart";
import { ResourceForm } from "../../department/resources/resource-form";
import type { Resource } from "@/lib/types";

const categoryVariant: Record<string, "default" | "secondary" | "outline" | "warning"> = {
  human: "default", financial: "warning", material: "secondary", equipment: "outline",
};

export default async function OfficerResourcesPage() {
  const supabase = await createClient();

  const [{ data: resources }, { data: activities }, { data: departments }] = await Promise.all([
    supabase.from("resources").select("*, departments(name)").order("created_at", { ascending: false }),
    supabase.from("activities").select("id, description").order("created_at", { ascending: false }),
    supabase.from("departments").select("id, name").order("name"),
  ]);

  const all = resources ?? [];
  const totalBudget = all.reduce((s, r) => s + r.quantity_planned * r.unit_cost, 0);
  const totalUsed = all.reduce((s, r) => s + r.quantity_used * r.unit_cost, 0);

  const byDept = (departments ?? []).map((d) => {
    const deptRes = all.filter((r) => r.department_id === d.id);
    const budget = deptRes.reduce((s, r) => s + r.quantity_planned * r.unit_cost, 0);
    const used = deptRes.reduce((s, r) => s + r.quantity_used * r.unit_cost, 0);
    return {
      name: d.name.length > 14 ? d.name.slice(0, 14) + "…" : d.name,
      value: budget > 0 ? Math.round((used / budget) * 100) : 0,
      color: used / (budget || 1) >= 0.75 ? "#22c55e" : "#f59e0b",
    };
  }).filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Resource Planning</h1>
          <p className="text-sm text-muted-foreground mt-1">Organisation-wide resource allocation and utilization</p>
        </div>
        <ResourceForm activities={activities ?? []} departments={departments ?? []} showDeptSelect />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Budget</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{totalBudget.toLocaleString()}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Used</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{totalUsed.toLocaleString()}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Overall Utilization</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{totalBudget > 0 ? Math.round((totalUsed / totalBudget) * 100) : 0}%</p></CardContent>
        </Card>
      </div>

      {byDept.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Utilization Rate by Department (%)</CardTitle></CardHeader>
          <CardContent><SimpleBarChart data={byDept} valueLabel="% Utilized" color="#6366f1" /></CardContent>
        </Card>
      )}

      {all.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">No resources logged yet.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {(all as (Resource & { departments: { name: string } | null })[]).map((r) => {
            const pct = r.quantity_planned > 0 ? Math.min(100, Math.round((r.quantity_used / r.quantity_planned) * 100)) : 0;
            return (
              <Card key={r.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">{r.title}</CardTitle>
                      <div className="flex flex-wrap gap-2 mt-1">
                        <Badge variant={categoryVariant[r.category] ?? "secondary"} className="capitalize">{r.category}</Badge>
                        {r.departments?.name && <span className="text-xs text-muted-foreground">{r.departments.name}</span>}
                        {r.period_reference && <span className="text-xs text-muted-foreground">{r.period_reference}</span>}
                      </div>
                    </div>
                    <p className="text-sm font-medium shrink-0">{r.quantity_used} / {r.quantity_planned} {r.unit}</p>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: pct >= 75 ? "#22c55e" : "#f59e0b" }} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{pct}% utilized</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
