import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeadlineForm } from "./deadline-form";
import type { ReportingDeadline } from "@/lib/types";

export default async function DeadlinesPage() {
  const supabase = await createClient();
  const [{ data: deadlines }, { data: departments }] = await Promise.all([supabase.from("reporting_deadlines").select("*, departments(name)").order("due_date"), supabase.from("departments").select("id, name").order("name")]);
  return <div className="space-y-6"><div className="flex items-center justify-between"><div><h1 className="text-2xl font-semibold">Reporting Deadlines</h1><p className="mt-1 text-sm text-muted-foreground">Automated reminders and overdue escalations use these dates.</p></div><DeadlineForm departments={departments ?? []} /></div>{(deadlines ?? []).length === 0 ? <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">No reporting deadlines configured.</CardContent></Card> : <div className="space-y-3">{(deadlines ?? []).map((deadline: ReportingDeadline & { departments: { name: string } | null }) => <Card key={deadline.id}><CardHeader className="pb-2"><CardTitle className="text-base">{deadline.reporting_period_name}</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">{deadline.departments?.name} · {deadline.reporting_period} · Due {deadline.due_date} · reminder {deadline.reminder_days} days before · escalate {deadline.escalation_days} day(s) after</CardContent></Card>)}</div>}</div>;
}
