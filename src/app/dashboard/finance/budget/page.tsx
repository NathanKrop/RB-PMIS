import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BudgetLineForm } from "./budget-line-form";
import { BudgetLineStatusButton } from "./budget-line-status-button";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  closed: "bg-gray-100 text-gray-600",
};

const CAT_COLORS: Record<string, string> = {
  personnel: "bg-indigo-100 text-indigo-700",
  operations: "bg-amber-100 text-amber-700",
  capital: "bg-green-100 text-green-700",
  transfers: "bg-slate-100 text-slate-700",
  other: "bg-pink-100 text-pink-700",
};

export default async function BudgetLinesPage() {
  const supabase = await createClient();

  const [{ data: budgetLines }, { data: departments }, { data: activities }] = await Promise.all([
    supabase.from("budget_lines").select("*, departments(name)").order("created_at", { ascending: false }),
    supabase.from("departments").select("id, name").order("name"),
    supabase.from("activities").select("id, description, department_id").order("description"),
  ]);

  const bls = budgetLines ?? [];
  const totalApproved = bls.reduce((s, b) => s + Number(b.amount_approved), 0);
  const totalRevised = bls.reduce((s, b) => s + Number(b.amount_revised ?? b.amount_approved), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Budget Lines</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage approved and revised budget allocations</p>
        </div>
        <BudgetLineForm departments={departments ?? []} activities={activities ?? []} />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Total Lines", value: bls.length },
          { label: "Approved Budget", value: totalApproved.toLocaleString() },
          { label: "Revised Budget", value: totalRevised.toLocaleString() },
          { label: "Active Lines", value: bls.filter((b) => b.status === "approved").length },
        ].map(({ label, value }) => (
          <Card key={label}>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{value}</p></CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">All Budget Lines</CardTitle></CardHeader>
        <CardContent>
          {bls.length === 0 ? (
            <p className="text-sm text-muted-foreground">No budget lines yet.</p>
          ) : (
            <div className="divide-y text-sm">
              {bls.map((b) => (
                <div key={b.id} className="py-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-0.5">
                    <p className="font-medium">{b.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {(b.departments as { name: string } | null)?.name} · {b.fiscal_year}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${CAT_COLORS[b.category] ?? ""}`}>{b.category}</span>
                    <span className="text-xs font-medium">{Number(b.amount_approved).toLocaleString()}</span>
                    {b.amount_revised && (
                      <span className="text-xs text-muted-foreground">→ {Number(b.amount_revised).toLocaleString()}</span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[b.status] ?? ""}`}>{b.status}</span>
                    <BudgetLineStatusButton id={b.id} currentStatus={b.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
