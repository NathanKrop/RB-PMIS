import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ReportForm } from "./report-form";
import { ReportActions } from "./report-actions";
import type { Report } from "@/lib/types";

const statusVariant: Record<string, "default" | "secondary" | "success" | "warning" | "destructive" | "outline"> = {
  draft: "secondary",
  submitted: "warning",
  reviewed: "outline",
  verified: "outline",
  approved: "success",
  rejected: "destructive",
};

export default async function ReportsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("users").select("department_id").eq("id", user!.id).single();

  const { data: reports } = await supabase
    .from("reports")
    .select("*")
    .eq("department_id", profile?.department_id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">Submit and track your periodic performance reports</p>
        </div>
        <ReportForm />
      </div>

      {(!reports || reports.length === 0) && (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground text-sm">
            No reports yet. Create your first report.
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {(reports ?? []).map((r: Report) => (
          <Card key={r.id}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base">{r.reporting_period_name}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5 capitalize">{r.reporting_period} report</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={statusVariant[r.status] ?? "secondary"} className="capitalize">{r.status}</Badge>
                  <ReportActions report={r} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
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
