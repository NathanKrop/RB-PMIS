import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, FileText, Upload, AlertCircle, Building2, BarChart2, Target, TrendingUp, FileCheck, AlertTriangle } from "lucide-react";

const dashboards: Record<string, { title: string; subtitle: string; stats: { label: string; value: number; icon: any }[] }> = {
  department: {
    title: "Welcome, Department User",
    subtitle: "ICT Department",
    stats: [
      { label: "Work Plans", value: 0, icon: ClipboardList },
      { label: "Reports Submitted", value: 0, icon: FileText },
      { label: "Evidence Files", value: 0, icon: Upload },
      { label: "Pending Actions", value: 0, icon: AlertCircle },
    ],
  },
  officer: {
    title: "Reporting Officer Dashboard",
    subtitle: "Overview of all departments and submissions",
    stats: [
      { label: "Departments", value: 8, icon: Building2 },
      { label: "Pending Reports", value: 0, icon: FileText },
      { label: "Evidence to Review", value: 0, icon: Upload },
      { label: "Strategic Objectives", value: 0, icon: BarChart2 },
    ],
  },
  management: {
    title: "Management Dashboard",
    subtitle: "Consolidated strategic performance overview",
    stats: [
      { label: "Strategic Objectives", value: 0, icon: Target },
      { label: "Approved Reports", value: 0, icon: FileCheck },
      { label: "Verified Evidence", value: 0, icon: TrendingUp },
      { label: "Delayed Activities", value: 0, icon: AlertTriangle },
    ],
  },
};

export default async function PreviewPage({ params }: { params: Promise<{ role: string }> }) {
  const { role } = await params;
  const dash = dashboards[role];
  if (!dash) redirect("/auth/login");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{dash.title}</h1>
        <p className="text-sm text-muted-foreground mt-1">{dash.subtitle}</p>
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {dash.stats.map(({ label, value, icon: Icon }) => (
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
      <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground text-center">
        Preview mode — no live data. Use the sidebar to explore pages.
      </div>
    </div>
  );
}
