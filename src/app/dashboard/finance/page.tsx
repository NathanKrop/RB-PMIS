import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SimpleBarChart } from "@/components/charts/bar-chart";
import { DonutChart } from "@/components/charts/donut-chart";
import Link from "next/link";

const CAT_COLORS: Record<string, string> = {
  personnel: "#6366f1", operations: "#f59e0b", capital: "#22c55e",
  transfers: "#64748b", other: "#ec4899",
};

const TYPE_COLORS: Record<string, string> = {
  submission: "bg-indigo-100 text-indigo-700",
  revision: "bg-amber-100 text-amber-700",
};

const REQ_STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

export default async function FinanceDashboardPage() {
  const supabase = await createClient();

  const [{ data: budgetLines }, { data: expenditures }, { data: departments }, { data: budgetRequests }] = await Promise.all([
    supabase.from("budget_lines").select("*, departments(name)"),
    supabase.from("expenditures").select("*"),
    supabase.from("departments").select("id, name").order("name"),
    supabase.from("budget_requests").select("*, departments(name)").order("created_at", { ascending: false }).limit(5),
  ]);

  const bls = budgetLines ?? [];
  const exps = expenditures ?? [];
  const reqs = budgetRequests ?? [];

  const totalApproved = bls.reduce((s, b) => s + Number(b.amount_approved), 0);
  const totalRevised = bls.reduce((s, b) => s + Number(b.amount_revised ?? b.amount_approved), 0);
  const totalSpent = exps.filter((e) => e.status === "approved").reduce((s, e) => s + Number(e.amount), 0);
  const totalPending = exps.filter((e) => e.status === "pending").reduce((s, e) => s + Number(e.amount), 0);
  const balance = totalRevised - totalSpent;
  const pendingRequests = reqs.filter((r) => r.status === "pending").length;

  const byCategory = ["personnel", "operations", "capital", "transfers", "other"].map((cat) => ({
    name: cat.charAt(0).toUpperCase() + cat.slice(1),
    value: bls.filter((b) => b.category === cat).reduce((s, b) => s + Number(b.amount_approved), 0),
    color: CAT_COLORS[cat],
  })).filter((c) => c.value > 0);

  const byDept = (departments ?? []).map((d) => ({
    name: d.name.length > 14 ? d.name.slice(0, 14) + "…" : d.name,
    value: exps.filter((e) => e.department_id === d.id && e.status === "approved").reduce((s, e) => s + Number(e.amount), 0),
    color: "#6366f1",
  })).filter((d) => d.value > 0);

  const stats = [
    { label: "Approved Budget", value: totalApproved.toLocaleString() },
    { label: "Revised Budget", value: totalRevised.toLocaleString() },
    { label: "Total Spent", value: totalSpent.toLocaleString() },
    { label: "Pending Approval", value: totalPending.toLocaleString() },
    { label: "Balance", value: balance.toLocaleString() },
    { label: "Utilization %", value: `${totalRevised > 0 ? Math.round((totalSpent / totalRevised) * 100) : 0}%` },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Finance Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Budget and expenditure overview</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {stats.map(({ label, value }) => (
          <Card key={label}>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{value}</p></CardContent>
          </Card>
        ))}
      </div>

      {/* Budget Requests Summary */}
      <Card className={pendingRequests > 0 ? "border-yellow-300" : ""}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">
              Budget Requests
              {pendingRequests > 0 && (
                <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                  {pendingRequests} pending
                </span>
              )}
            </CardTitle>
            <Link href="/dashboard/finance/requests" className="text-xs text-primary hover:underline">
              View all →
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {reqs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No requests submitted yet.</p>
          ) : (
            <div className="divide-y text-sm">
              {reqs.map((r) => {
                const dept = r.departments as { name: string } | null;
                return (
                  <div key={r.id} className="py-2 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{r.title}</p>
                      <p className="text-xs text-muted-foreground">{dept?.name} · {r.fiscal_year}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${TYPE_COLORS[r.request_type] ?? ""}`}>
                        {r.request_type}
                      </span>
                      <span className="text-xs font-semibold">{Number(r.amount_requested).toLocaleString()}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${REQ_STATUS_COLORS[r.status] ?? ""}`}>
                        {r.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {byCategory.length > 0 && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Budget by Category</CardTitle></CardHeader>
            <CardContent><DonutChart data={byCategory} /></CardContent>
          </Card>
        )}
        {byDept.length > 0 && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Expenditure by Department</CardTitle></CardHeader>
            <CardContent><SimpleBarChart data={byDept} valueLabel="Spent" color="#6366f1" /></CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Recent Expenditures</CardTitle></CardHeader>
        <CardContent>
          {exps.length === 0 ? (
            <p className="text-sm text-muted-foreground">No expenditures recorded yet.</p>
          ) : (
            <div className="divide-y text-sm">
              {exps.slice(0, 8).map((e) => (
                <div key={e.id} className="flex items-center justify-between py-2">
                  <span className="truncate max-w-xs">{e.description}</span>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-medium">{Number(e.amount).toLocaleString()}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      e.status === "approved" ? "bg-green-100 text-green-700" :
                      e.status === "rejected" ? "bg-red-100 text-red-700" :
                      "bg-yellow-100 text-yellow-700"
                    }`}>{e.status}</span>
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
