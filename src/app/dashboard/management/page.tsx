import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, TrendingUp, FileCheck, AlertTriangle } from "lucide-react";

export default async function ManagementDashboard() {
  const supabase = await createClient();

  const [
    { count: objectiveCount },
    { count: approvedReports },
    { count: verifiedEvidence },
    { count: delayedActivities },
  ] = await Promise.all([
    supabase.from("strategic_objectives").select("*", { count: "exact", head: true }),
    supabase.from("reports").select("*", { count: "exact", head: true }).eq("status", "approved"),
    supabase.from("evidence").select("*", { count: "exact", head: true }).eq("verification_status", "verified"),
    supabase.from("activities").select("*", { count: "exact", head: true }).eq("status", "delayed"),
  ]);

  const stats = [
    { label: "Strategic Objectives", value: objectiveCount ?? 0, icon: Target },
    { label: "Approved Reports", value: approvedReports ?? 0, icon: FileCheck },
    { label: "Verified Evidence", value: verifiedEvidence ?? 0, icon: TrendingUp },
    { label: "Delayed Activities", value: delayedActivities ?? 0, icon: AlertTriangle },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Management Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Consolidated strategic performance overview</p>
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
