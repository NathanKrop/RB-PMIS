import { createClient } from "@/lib/supabase/server";
import { RiskRegister } from "@/components/risk-register";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DonutChart } from "@/components/charts/donut-chart";
import { TrendLineChart } from "@/components/charts/line-chart";
import type { Department, Risk } from "@/lib/types";

export default async function ManagementRisksPage() {
  const supabase = await createClient();
  const [{ data: risks }, { data: departments }] = await Promise.all([supabase.from("risks").select("*, departments(name)").order("created_at", { ascending: false }), supabase.from("departments").select("*").order("name")]);
  const allRisks = (risks ?? []) as (Risk & { departments: { name: string } | null })[];
  const colors: Record<string, string> = { open: "#64748b", mitigating: "#2563eb", escalated: "#dc2626", closed: "#16a34a" };
  const statusChart = ["open", "mitigating", "escalated", "closed"].map((status) => ({ name: status, value: allRisks.filter((risk) => risk.status === status).length, color: colors[status] }));
  const now = new Date();
  const trend = Array.from({ length: 6 }, (_, index) => { const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1); const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`; return { name: date.toLocaleString("default", { month: "short" }), Logged: allRisks.filter((risk) => risk.created_at.startsWith(key)).length, Escalated: allRisks.filter((risk) => risk.created_at.startsWith(key) && risk.status === "escalated").length }; });
  return <div className="space-y-6"><div><h1 className="text-2xl font-semibold">Risk Register</h1><p className="mt-1 text-sm text-muted-foreground">Organisation-wide risk and escalation oversight</p></div><div className="grid gap-4 md:grid-cols-2"><Card><CardHeader className="pb-2"><CardTitle className="text-sm">Risk Status Distribution</CardTitle></CardHeader><CardContent><DonutChart data={statusChart} /></CardContent></Card><Card><CardHeader className="pb-2"><CardTitle className="text-sm">Risk Trend</CardTitle></CardHeader><CardContent><TrendLineChart data={trend} lines={[{ key: "Logged", label: "Logged", color: "#2563eb" }, { key: "Escalated", label: "Escalated", color: "#dc2626" }]} /></CardContent></Card></div><RiskRegister risks={allRisks} departments={(departments ?? []) as Department[]} editable={false} /></div>;
}
