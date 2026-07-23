import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ResourceForm } from "./resource-form";
import type { Resource } from "@/lib/types";

const categoryVariant: Record<string, "default" | "secondary" | "outline" | "warning"> = {
  human: "default",
  financial: "warning",
  material: "secondary",
  equipment: "outline",
};

export default async function DepartmentResourcesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("users").select("department_id").eq("id", user!.id).single();
  const deptId = profile?.department_id;

  const [{ data: resources }, { data: activities }] = await Promise.all([
    supabase.from("resources").select("*").eq("department_id", deptId).order("created_at", { ascending: false }),
    supabase.from("activities").select("id, description").eq("department_id", deptId),
  ]);

  const all = resources ?? [];
  const totalBudget = all.reduce((s, r) => s + r.quantity_planned * r.unit_cost, 0);
  const totalUsed = all.reduce((s, r) => s + r.quantity_used * r.unit_cost, 0);
  const utilizationPct = totalBudget > 0 ? Math.round((totalUsed / totalBudget) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Resource Planning</h1>
          <p className="text-sm text-muted-foreground mt-1">Track planned vs actual resource utilization</p>
        </div>
        <ResourceForm activities={activities ?? []} />
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
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Utilization Rate</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{utilizationPct}%</p>
            <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full transition-all"
                style={{ width: `${Math.min(100, utilizationPct)}%`, backgroundColor: utilizationPct > 100 ? "#ef4444" : utilizationPct >= 75 ? "#22c55e" : "#f59e0b" }} />
            </div>
          </CardContent>
        </Card>
      </div>

      {all.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">No resources added yet.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {(all as Resource[]).map((r) => {
            const budget = r.quantity_planned * r.unit_cost;
            const used = r.quantity_used * r.unit_cost;
            const pct = r.quantity_planned > 0 ? Math.min(100, Math.round((r.quantity_used / r.quantity_planned) * 100)) : 0;
            return (
              <Card key={r.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">{r.title}</CardTitle>
                      <div className="flex flex-wrap gap-2 mt-1">
                        <Badge variant={categoryVariant[r.category] ?? "secondary"} className="capitalize">{r.category}</Badge>
                        {r.period_reference && <span className="text-xs text-muted-foreground">{r.period_reference}</span>}
                      </div>
                    </div>
                    <div className="text-right text-sm shrink-0">
                      <p className="font-medium">{used.toLocaleString()} / {budget.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{r.quantity_used} / {r.quantity_planned} {r.unit}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: pct > 100 ? "#ef4444" : pct >= 75 ? "#22c55e" : "#f59e0b" }} />
                  </div>
                  <p className="text-xs text-muted-foreground">{pct}% utilized · Unit cost: {r.unit_cost.toLocaleString()}</p>
                  {r.notes && <p className="text-xs text-muted-foreground">{r.notes}</p>}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
