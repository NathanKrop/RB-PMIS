import { createClient } from "@/lib/supabase/server";
import { DeadlineOverview } from "@/components/deadline-overview";
import { DeadlineForm } from "./deadline-form";
import type { ReportingDeadline } from "@/lib/types";

function enrichWithSubmissionStatus(
  deadlines: (ReportingDeadline & { departments: { name: string } | null })[],
  reportPeriods: Set<string>
) {
  return deadlines.map((d) => ({
    ...d,
    has_submission: reportPeriods.has(`${d.department_id}::${d.reporting_period_name.toLowerCase().trim()}`),
  }));
}

export default async function DeadlinesPage() {
  const supabase = await createClient();

  const [{ data: deadlines }, { data: departments }, { data: reports }] = await Promise.all([
    supabase.from("reporting_deadlines").select("*, departments(name)").order("due_date"),
    supabase.from("departments").select("id, name").order("name"),
    supabase.from("reports").select("department_id, reporting_period_name").neq("status", "draft"),
  ]);

  const reportPeriods = new Set(
    (reports ?? []).map((r) => `${r.department_id}::${r.reporting_period_name.toLowerCase().trim()}`)
  );

  const enriched = enrichWithSubmissionStatus(deadlines ?? [], reportPeriods);

  // Group by due status
  const overdue = enriched.filter((d) => !d.has_submission);
  const submitted = enriched.filter((d) => d.has_submission);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Reporting Deadlines</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track upcoming, overdue, and completed reporting deadlines across departments.
          </p>
        </div>
        <DeadlineForm departments={departments ?? []} />
      </div>

      {enriched.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <div className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold">No deadlines configured</h2>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Add reporting deadlines to track submission status across departments.
          </p>
          <DeadlineForm departments={departments ?? []} />
        </div>
      ) : null}

      {enriched.length > 0 ? (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="rounded-lg border bg-card p-4">
              <p className="text-sm text-muted-foreground">Total Deadlines</p>
              <p className="text-2xl font-bold">{enriched.length}</p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <p className="text-sm text-muted-foreground">Overdue</p>
              <p className="text-2xl font-bold text-destructive">
                {overdue.filter((d) => new Date(d.due_date) < new Date()).length}
              </p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <p className="text-sm text-muted-foreground">Due Soon (7 days)</p>
              <p className="text-2xl font-bold text-amber-500">
                {overdue.filter((d) => {
                  const days = (new Date(d.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
                  return days >= 0 && days <= 7;
                }).length}
              </p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <p className="text-sm text-muted-foreground">Submitted</p>
              <p className="text-2xl font-bold text-green-600">{submitted.length}</p>
            </div>
          </div>

          {overdue.length > 0 ? (
            <DeadlineOverview
              deadlines={overdue}
              title="Pending Deadlines"
            />
          ) : null}

          {submitted.length > 0 ? (
            <DeadlineOverview
              deadlines={submitted}
              title="Completed Submissions"
            />
          ) : null}
        </>
      ) : null}
    </div>
  );

}
