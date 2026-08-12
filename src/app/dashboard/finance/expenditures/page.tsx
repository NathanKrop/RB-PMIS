import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExpenditureForm } from "./expenditure-form";
import { ExpenditureStatusButtons } from "./expenditure-status-buttons";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

export default async function ExpendituresPage() {
  const supabase = await createClient();

  const [{ data: expenditures }, { data: budgetLines }] = await Promise.all([
    supabase.from("expenditures").select("*, budget_lines(title, fiscal_year, amount_approved, amount_revised), departments(name)").order("expenditure_date", { ascending: false }),
    supabase.from("budget_lines").select("*, departments(name)").eq("status", "approved").order("title"),
  ]);

  const exps = expenditures ?? [];
  const totalSpent = exps.filter((e) => e.status === "approved").reduce((s, e) => s + Number(e.amount), 0);
  const totalPending = exps.filter((e) => e.status === "pending").reduce((s, e) => s + Number(e.amount), 0);
  const totalRejected = exps.filter((e) => e.status === "rejected").reduce((s, e) => s + Number(e.amount), 0);

  // Budget utilization per line
  const blUtilization = (budgetLines ?? []).map((b) => {
    const spent = exps.filter((e) => e.budget_line_id === b.id && e.status === "approved").reduce((s, e) => s + Number(e.amount), 0);
    const budget = Number(b.amount_revised ?? b.amount_approved);
    return { ...b, spent, budget, pct: budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0 };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Expenditures</h1>
          <p className="text-sm text-muted-foreground mt-1">Record and review all expenditure transactions</p>
        </div>
        <ExpenditureForm budgetLines={budgetLines ?? []} />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Total Transactions", value: exps.length },
          { label: "Approved Spend", value: totalSpent.toLocaleString() },
          { label: "Pending Review", value: totalPending.toLocaleString() },
          { label: "Rejected", value: totalRejected.toLocaleString() },
        ].map(({ label, value }) => (
          <Card key={label}>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{value}</p></CardContent>
          </Card>
        ))}
      </div>

      {blUtilization.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Budget Line Utilization</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {blUtilization.map((b) => (
              <div key={b.id} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium truncate max-w-xs">{b.title} <span className="text-muted-foreground">({b.fiscal_year})</span></span>
                  <span>{b.spent.toLocaleString()} / {b.budget.toLocaleString()} ({b.pct}%)</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${b.pct >= 90 ? "bg-red-500" : b.pct >= 70 ? "bg-amber-500" : "bg-green-500"}`}
                    style={{ width: `${b.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">All Expenditures</CardTitle></CardHeader>
        <CardContent>
          {exps.length === 0 ? (
            <p className="text-sm text-muted-foreground">No expenditures recorded yet.</p>
          ) : (
            <div className="divide-y text-sm">
              {exps.map((e) => {
                const bl = e.budget_lines as { title: string; fiscal_year: string } | null;
                const dept = e.departments as { name: string } | null;
                return (
                  <div key={e.id} className="py-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-0.5">
                      <p className="font-medium">{e.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {dept?.name} · {bl?.title} · {e.expenditure_date}
                        {e.payment_reference && ` · Ref: ${e.payment_reference}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-medium">{Number(e.amount).toLocaleString()}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[e.status] ?? ""}`}>{e.status}</span>
                      {e.status === "pending" && <ExpenditureStatusButtons id={e.id} />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
