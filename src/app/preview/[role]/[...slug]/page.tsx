import { WorkPlanForm } from "@/app/dashboard/department/work-plans/work-plan-form";
import { ActivityForm } from "@/app/dashboard/department/work-plans/activity-form";
import { ReportForm } from "@/app/dashboard/department/reports/report-form";
import { EvidenceUploadForm } from "@/app/dashboard/department/evidence/evidence-upload-form";
import { DepartmentForm } from "@/app/dashboard/officer/departments/department-form";
import { ObjectiveForm } from "@/app/dashboard/officer/framework/objective-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const pageMeta: Record<string, { title: string; subtitle: string; action?: React.ReactNode }> = {
  "work-plans": {
    title: "Work Plans",
    subtitle: "Manage your department's work plans and activities",
    action: <WorkPlanForm />,
  },
  reports: {
    title: "Reports",
    subtitle: "Submit and track your periodic performance reports",
    action: <ReportForm />,
  },
  evidence: {
    title: "Evidence",
    subtitle: "Upload and manage supporting evidence files",
    action: <EvidenceUploadForm />,
  },
  departments: {
    title: "Departments",
    subtitle: "Manage departments and user assignments",
    action: <DepartmentForm />,
  },
  framework: {
    title: "Results Framework",
    subtitle: "Manage strategic objectives, outcomes, and outputs",
    action: <ObjectiveForm />,
  },
  indicators: {
    title: "Outcome Indicators",
    subtitle: "Track progress against strategic outcome targets",
  },
};

export default async function PreviewSubPage({
  params,
}: {
  params: Promise<{ role: string; slug: string[] }>;
}) {
  const { slug } = await params;
  const page = slug[slug.length - 1];
  const meta = pageMeta[page];

  const title = meta?.title ?? page.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const subtitle = meta?.subtitle ?? "";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold capitalize">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        {meta?.action}
      </div>
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground text-sm">
          No data yet — connect Supabase and sign in to see live data here.
        </CardContent>
      </Card>
    </div>
  );
}
