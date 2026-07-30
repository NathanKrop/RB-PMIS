import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, ClipboardCheck } from "lucide-react";
import type { DataQualityCheck } from "@/lib/types";
import { Breadcrumb, BreadcrumbItem } from "@/components/ui/breadcrumb";

const variants: Record<string, "destructive" | "warning" | "secondary"> = { high: "destructive", medium: "warning", low: "secondary" };

export default async function ManagementDataQualityPage() {
  const supabase = await createClient();
  const { data: checks } = await supabase.from("data_quality_checks").select("*, departments(name)").order("created_at", { ascending: false });
  const allChecks = checks ?? [];
  const unresolved = allChecks.filter((check) => !check.resolved);
  const high = unresolved.filter((check) => check.severity === "high").length;
  return <div className="space-y-6">
    <div><Breadcrumb compact className="mb-3">
          <BreadcrumbItem current>Data Quality</BreadcrumbItem>
        </Breadcrumb>
        <h1 className="text-2xl font-semibold">Data Quality</h1><p className="mt-1 text-sm text-muted-foreground">Organisation-wide view of logged validation issues</p></div>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Unresolved</CardTitle><ClipboardCheck className="h-4 w-4" /></CardHeader><CardContent><p className="text-2xl font-bold">{unresolved.length}</p></CardContent></Card>
      <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">High Severity</CardTitle><AlertTriangle className="h-4 w-4 text-destructive" /></CardHeader><CardContent><p className="text-2xl font-bold text-destructive">{high}</p></CardContent></Card>
      <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Resolved</CardTitle><CheckCircle2 className="h-4 w-4 text-green-600" /></CardHeader><CardContent><p className="text-2xl font-bold">{allChecks.length - unresolved.length}</p></CardContent></Card>
    </div>
    {allChecks.length === 0 ? <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">No data-quality issues have been logged yet.</CardContent></Card> : <div className="space-y-2">{allChecks.map((check: DataQualityCheck & { departments: { name: string } | null }) => <Card key={check.id}><CardContent className="flex items-start justify-between gap-3 py-3"><div><div className="mb-1 flex flex-wrap items-center gap-2"><span className="text-sm font-medium">{check.entity}</span><Badge variant={variants[check.severity]} className="capitalize">{check.severity}</Badge><Badge variant="outline" className="capitalize">{check.check_type}</Badge>{check.departments?.name && <span className="text-xs text-muted-foreground">{check.departments.name}</span>}</div><p className="text-sm text-muted-foreground">{check.issue}</p></div><Badge variant={check.resolved ? "secondary" : "outline"}>{check.resolved ? "Resolved" : "Open"}</Badge></CardContent></Card>)}</div>}
  </div>;
}
