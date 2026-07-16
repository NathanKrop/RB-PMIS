import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, FileText, Upload, BarChart2 } from "lucide-react";

export default async function OfficerDashboard() {
  const supabase = await createClient();

  const [
    { count: deptCount },
    { count: reportCount },
    { count: pendingEvidence },
    { count: objectiveCount },
  ] = await Promise.all([
    supabase.from("departments").select("*", { count: "exact", head: true }),
    supabase.from("reports").select("*", { count: "exact", head: true }).eq("status", "submitted"),
    supabase.from("evidence").select("*", { count: "exact", head: true }).eq("verification_status", "pending"),
    supabase.from("strategic_objectives").select("*", { count: "exact", head: true }),
  ]);

  const stats = [
    { label: "Departments", value: deptCount ?? 0, icon: Building2 },
    { label: "Pending Reports", value: reportCount ?? 0, icon: FileText },
    { label: "Evidence to Review", value: pendingEvidence ?? 0, icon: Upload },
    { label: "Strategic Objectives", value: objectiveCount ?? 0, icon: BarChart2 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Reporting Officer Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Overview of all departments and submissions</p>
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
