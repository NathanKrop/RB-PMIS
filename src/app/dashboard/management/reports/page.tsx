import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Report } from "@/lib/types";

const statusVariant: Record<string, "default" | "secondary" | "success" | "warning" | "destructive" | "outline"> = {
  approved: "success",
  verified: "outline",
};

export default async function ManagementReportsPage() {
  const supabase = await createClient();

  const { data: reports } = await supabase
    .from("reports")
    .select("*, departments(name)")
    .in("status", ["approved", "verified"])
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Reports</h1>
        <p className="text-sm text-muted-foreground mt-1">Approved and verified department reports</p>
      </div>

      {(!reports || reports.length === 0) && (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground text-sm">
            No approved reports available yet.
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {(reports ?? []).map((r: Report & { departments: { name: string } | null }) => (
          <Card key={r.id}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base">{r.reporting_period_name}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {r.departments?.name} · <span className="capitalize">{r.reporting_period}</span>
                  </p>
                </div>
                <Badge variant={statusVariant[r.status] ?? "secondary"} className="capitalize">{r.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              {r.outcome_progress && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Outcome Progress</p>
                  <p className="mt-0.5">{r.outcome_progress}</p>
                </div>
              )}
              {r.key_results && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Key Results</p>
                  <p className="mt-0.5">{r.key_results}</p>
                </div>
              )}
              {r.challenges && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Challenges</p>
                  <p className="mt-0.5">{r.challenges}</p>
                </div>
              )}
              {r.adaptive_actions && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Adaptive Actions</p>
                  <p className="mt-0.5">{r.adaptive_actions}</p>
                </div>
              )}
              {r.next_period_priorities && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Next Period Priorities</p>
                  <p className="mt-0.5">{r.next_period_priorities}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
