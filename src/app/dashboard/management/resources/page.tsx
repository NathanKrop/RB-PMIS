import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SimpleBarChart } from "@/components/charts/bar-chart";
import { DonutChart } from "@/components/charts/donut-chart";

const CATEGORY_COLORS: Record<string, string> = {
  human: "#6366f1", financial: "#f59e0b", material: "#22c55e", equipment: "#64748b",
};

export default async function ManagementResourcesPage() {
  const supabase = await createClient();

  const [{ data: resources }, { data: departments }] = await Promise.all([
    supabase.from("resources").select("*, departments(name)").order("created_at", { ascending: false }),
    supabase.from("departments").select("id, name").order("name"),
  ]);

  const all = resources ?? [];
  const totalBudget = all.reduce((s, r) => s + r.quantity_planned * r.unit_cost, 0);
  const totalUsed = all.reduce((s, r) => s + r.quantity_used * r.unit_cost, 0);
  const variance = totalBudget - totalUsed;

  // By category donut
  const byCategory = ["human", "financial", "material", "equipment"].map((cat) => ({
    name: cat.charAt(0).toUpperCase() + cat.slice(1),
    value: all.filter((r) => r.category === cat).reduce((s, r) => s + r.quantity_planned * r.unit_cost, 0),
    color: CATEGORY_COLORS[cat],
  })).filter((c) => c.value > 0);

  // Budget vs used by department
  const deptBudget = (departments ?? []).map((d) => {
    const deptRes = all.filter((r) => r.department_id === d.id);
    return {
      name: d.name.length > 12 ? d.name.slice(0, 12) + "…" : d.name,
      value: deptRes.reduce((s, r) => s + r.quantity_planned * r.unit_cost, 0),
      color: "#6366f1",
    };
  }).filter((d) => d.value > 0);

  const deptUsed = (departments ?? []).map((d) => {
    const deptRes = all.filter((r) => r.department_id === d.id);
    return {
      name: d.name.length > 12 ? d.name.slice(0, 12) + "…" : d.name,
      value: deptRes.reduce((s, r) => s + r.quantity_used * r.unit_cost, 0),
      color: "#22c55e",
    };
  }).filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Resource Planning</h1>
        <p className="text-sm text-muted-foreground mt-1">Organisation-wide budget allocation and utilization overview</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Total Budget", value: totalBudget.toLocaleString() },
          { label: "Total Used", value: totalUsed.toLocaleString() },
          { label: "Variance", value: variance.toLocaleString() },
          { label: "Utilization %", value: `${totalBudget > 0 ? Math.round((totalUsed / totalBudget) * 100) : 0}%` },
        ].map(({ label, value }) => (
          <Card key={label}>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{value}</p></CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Budget by Category</CardTitle></CardHeader>
          <CardContent><DonutChart data={byCategory} /></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Budget by Department</CardTitle></CardHeader>
          <CardContent><SimpleBarChart data={deptBudget} valueLabel="Budget" color="#6366f1" /></CardContent>
        </Card>
      </div>

      {deptUsed.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Actual Usage by Department</CardTitle></CardHeader>
          <CardContent><SimpleBarChart data={deptUsed} valueLabel="Used" color="#22c55e" /></CardContent>
        </Card>
      )}
    </div>
  );
}
