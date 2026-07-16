import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, FileText, Upload, AlertCircle } from "lucide-react";

export default async function DepartmentDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("users")
    .select("*, departments(name)")
    .eq("id", user!.id)
    .single();

  const deptId = profile?.department_id;

  const [{ count: workPlanCount }, { count: reportCount }, { count: evidenceCount }] =
    await Promise.all([
      supabase.from("work_plans").select("*", { count: "exact", head: true }).eq("department_id", deptId),
      supabase.from("reports").select("*", { count: "exact", head: true }).eq("department_id", deptId),
      supabase.from("evidence").select("*", { count: "exact", head: true }).eq("uploaded_by", user!.id),
    ]);

  const stats = [
    { label: "Work Plans", value: workPlanCount ?? 0, icon: ClipboardList },
    { label: "Reports Submitted", value: reportCount ?? 0, icon: FileText },
    { label: "Evidence Files", value: evidenceCount ?? 0, icon: Upload },
    { label: "Pending Actions", value: 0, icon: AlertCircle },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Welcome, {profile?.full_name ?? "User"}</h1>
        <p className="text-muted-foreground text-sm mt-1">{profile?.departments?.name}</p>
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
