import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  submitted: "bg-blue-100 text-blue-700",
  reviewed: "bg-yellow-100 text-yellow-700",
  verified: "bg-indigo-100 text-indigo-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

export default async function FinanceReportsPage() {
  const supabase = await createClient();

  const [{ data: reports }, { data: budgetLines }, { data: expenditures }] = await Promise.all([
    supabase.from("reports").select("*, departments(name)").order("created_at", { ascending: false }),
    supabase.from("budget_lines").select("department_id, amount_approved, amount_revised"),
    supabase.from("expenditures").select("department_id, amount, status"),
  ]);

  const rpts = reports ?? [];
  const bls = budgetLines ?? [];
  const exps = expenditures ?? [];

  // Enrich each report with financial summary for its department
  const enriched = rpts.map((r) => {
    const deptBudget = bls.filter((b) => b.department_id === r.department_id)
      .reduce((s, b) => s + Number(b.amount_revised ?? b.amount_approved), 0);
    const deptSpent = exps.filter((e) => e.department_id === r.department_id && e.status === "approved")
      .reduce((s, e) => s + Number(e.amount), 0);
    return { ...r, deptBudget, deptSpent };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Programme Reports</h1>
        <p className="text-sm text-muted-foreground mt-1">Read-only view of departmental reports with financial context</p>
      </div>

      {enriched.length === 0 ? (
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">No reports available.</p></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {enriched.map((r) => {
            const dept = r.departments as { name: string } | null;
            const utilPct = r.deptBudget > 0 ? Math.round((r.deptSpent / r.deptBudget) * 100) : 0;
            return (
              <Card key={r.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-sm font-medium">{r.reporting_period_name}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">{dept?.name} · {r.reporting_period}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${STATUS_COLORS[r.status] ?? ""}`}>{r.status}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {r.outcome_progress && (
                    <p className="text-sm"><span className="font-medium">Outcome Progress: </span>{r.outcome_progress}</p>
                  )}
                  {r.key_results && (
                    <p className="text-sm"><span className="font-medium">Key Results: </span>{r.key_results}</p>
                  )}
                  <div className="pt-1 border-t">
                    <p className="text-xs text-muted-foreground mb-1">
                      Financial: {r.deptSpent.toLocaleString()} spent of {r.deptBudget.toLocaleString()} budget ({utilPct}%)
                    </p>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${utilPct >= 90 ? "bg-red-500" : utilPct >= 70 ? "bg-amber-500" : "bg-green-500"}`}
                        style={{ width: `${Math.min(100, utilPct)}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
