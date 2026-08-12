import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BudgetRequestForm } from "./budget-request-form";
import { BudgetRequestReviewButtons } from "./budget-request-review-buttons";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

const TYPE_COLORS: Record<string, string> = {
  submission: "bg-indigo-100 text-indigo-700",
  revision: "bg-amber-100 text-amber-700",
};

export default async function BudgetRequestsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("users").select("role").eq("id", user!.id).single();

  const [{ data: requests }, { data: departments }, { data: budgetLines }] = await Promise.all([
    supabase.from("budget_requests")
      .select("*, departments(name), budget_lines(title), reviewer:reviewed_by(full_name)")
      .order("created_at", { ascending: false }),
    supabase.from("departments").select("id, name").order("name"),
    supabase.from("budget_lines").select("id, title, fiscal_year").order("title"),
  ]);

  const reqs = requests ?? [];
  const pending = reqs.filter((r) => r.status === "pending");
  const canReview = profile?.role === "management" || profile?.role === "finance";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Budget Requests</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Submit new budget allocations or request revisions to existing lines
          </p>
        </div>
        {profile?.role === "finance" && (
          <BudgetRequestForm departments={departments ?? []} budgetLines={budgetLines ?? []} />
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Total Requests", value: reqs.length },
          { label: "Pending", value: pending.length },
          { label: "Approved", value: reqs.filter((r) => r.status === "approved").length },
          { label: "Rejected", value: reqs.filter((r) => r.status === "rejected").length },
        ].map(({ label, value }) => (
          <Card key={label}>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{value}</p></CardContent>
          </Card>
        ))}
      </div>

      {pending.length > 0 && (
        <Card className="border-yellow-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-700">⏳ Pending Review ({pending.length})</CardTitle>
          </CardHeader>
          <CardContent className="divide-y text-sm">
            {pending.map((r) => {
              const dept = r.departments as { name: string } | null;
              return (
                <div key={r.id} className="py-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <p className="font-medium">{r.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {dept?.name} · {r.fiscal_year} · {r.category}
                      </p>
                      <p className="text-xs text-muted-foreground">{r.justification}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${TYPE_COLORS[r.request_type] ?? ""}`}>
                        {r.request_type}
                      </span>
                      <span className="text-sm font-semibold">{Number(r.amount_requested).toLocaleString()}</span>
                    </div>
                  </div>
                  {canReview && <BudgetRequestReviewButtons id={r.id} />}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">All Requests</CardTitle></CardHeader>
        <CardContent>
          {reqs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No budget requests yet.</p>
          ) : (
            <div className="divide-y text-sm">
              {reqs.map((r) => {
                const dept = r.departments as { name: string } | null;
                const bl = r.budget_lines as { title: string } | null;
                const reviewer = r.reviewer as { full_name: string | null } | null;
                return (
                  <div key={r.id} className="py-3 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-0.5">
                      <p className="font-medium">{r.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {dept?.name} · {r.fiscal_year}
                        {bl && ` · Revising: ${bl.title}`}
                      </p>
                      {r.review_notes && (
                        <p className="text-xs text-muted-foreground italic">Note: {r.review_notes}</p>
                      )}
                      {reviewer?.full_name && (
                        <p className="text-xs text-muted-foreground">Reviewed by {reviewer.full_name}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${TYPE_COLORS[r.request_type] ?? ""}`}>
                        {r.request_type}
                      </span>
                      <span className="text-sm font-semibold">{Number(r.amount_requested).toLocaleString()}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[r.status] ?? ""}`}>
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
    </div>
  );
}
