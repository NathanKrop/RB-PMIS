import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TravelRequestForm } from "./travel-request-form";
import { TravelRequestActions } from "./travel-request-actions";

const STATUS_COLORS: Record<string, string> = {
  draft:     "bg-gray-100 text-gray-600",
  submitted: "bg-yellow-100 text-yellow-700",
  approved:  "bg-green-100 text-green-700",
  rejected:  "bg-red-100 text-red-700",
  cancelled: "bg-slate-100 text-slate-500",
};

const TRANSPORT_ICONS: Record<string, string> = {
  air: "✈️", road: "🚗", rail: "🚆", sea: "🚢", other: "🧳",
};

export default async function TravelRequestsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("users").select("role").eq("id", user!.id).single();
  const role = profile?.role ?? "finance";

  const [{ data: requests }, { data: departments }, { data: budgetLines }] = await Promise.all([
    supabase.from("travel_requests")
      .select("*, departments(name), budget_lines(title), reviewer:reviewed_by(full_name)")
      .order("created_at", { ascending: false }),
    supabase.from("departments").select("id, name").order("name"),
    supabase.from("budget_lines").select("id, title, fiscal_year").eq("status", "approved").order("title"),
  ]);

  const reqs = requests ?? [];
  const totalCost = reqs.filter((r) => r.status === "approved")
    .reduce((s, r) => s + Number(r.estimated_cost) + Number(r.total_per_diem), 0);
  const totalAdvance = reqs.filter((r) => r.status === "approved")
    .reduce((s, r) => s + Number(r.advance_requested), 0);

  const stats = [
    { label: "Total Requests", value: reqs.length },
    { label: "Pending Review", value: reqs.filter((r) => r.status === "submitted").length },
    { label: "Approved", value: reqs.filter((r) => r.status === "approved").length },
    { label: "Approved Cost", value: totalCost.toLocaleString() },
    { label: "Advances Issued", value: totalAdvance.toLocaleString() },
    { label: "Rejected", value: reqs.filter((r) => r.status === "rejected").length },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Travel Requests</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage staff travel authorisations, per diem, and advances
          </p>
        </div>
        {role === "finance" && (
          <TravelRequestForm departments={departments ?? []} budgetLines={budgetLines ?? []} />
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {stats.map(({ label, value }) => (
          <Card key={label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
            </CardHeader>
            <CardContent><p className="text-2xl font-bold">{value}</p></CardContent>
          </Card>
        ))}
      </div>

      {/* Pending section */}
      {reqs.filter((r) => r.status === "submitted").length > 0 && (
        <Card className="border-yellow-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-700">
              ⏳ Awaiting Approval ({reqs.filter((r) => r.status === "submitted").length})
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y text-sm">
            {reqs.filter((r) => r.status === "submitted").map((r) => {
              const dept = r.departments as { name: string } | null;
              return (
                <div key={r.id} className="py-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <p className="font-medium">
                        {TRANSPORT_ICONS[r.transport_mode] ?? "🧳"} {r.traveller_name} → {r.destination}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {dept?.name} · {r.departure_date} – {r.return_date}
                      </p>
                      <p className="text-xs text-muted-foreground">{r.purpose}</p>
                    </div>
                    <div className="text-right shrink-0 space-y-0.5">
                      <p className="text-sm font-semibold">
                        {(Number(r.estimated_cost) + Number(r.total_per_diem)).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Advance: {Number(r.advance_requested).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <TravelRequestActions id={r.id} status={r.status} role={role} />
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* All requests */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">All Travel Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {reqs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No travel requests yet.</p>
          ) : (
            <div className="divide-y text-sm">
              {reqs.map((r) => {
                const dept = r.departments as { name: string } | null;
                const bl = r.budget_lines as { title: string } | null;
                const reviewer = r.reviewer as { full_name: string | null } | null;
                const totalCostRow = Number(r.estimated_cost) + Number(r.total_per_diem);
                return (
                  <div key={r.id} className="py-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-0.5 min-w-0">
                      <p className="font-medium">
                        {TRANSPORT_ICONS[r.transport_mode] ?? "🧳"} {r.traveller_name}
                        <span className="text-muted-foreground font-normal"> → {r.destination}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {dept?.name} · {r.departure_date} – {r.return_date}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{r.purpose}</p>
                      {bl && <p className="text-xs text-muted-foreground">Budget: {bl.title}</p>}
                      {r.review_notes && (
                        <p className="text-xs italic text-muted-foreground">Note: {r.review_notes}</p>
                      )}
                      {reviewer?.full_name && (
                        <p className="text-xs text-muted-foreground">Reviewed by {reviewer.full_name}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{totalCostRow.toLocaleString()}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[r.status] ?? ""}`}>
                          {r.status}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Per diem: {Number(r.total_per_diem).toLocaleString()} ·
                        Advance: {Number(r.advance_requested).toLocaleString()}
                      </p>
                      <TravelRequestActions id={r.id} status={r.status} role={role} />
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
