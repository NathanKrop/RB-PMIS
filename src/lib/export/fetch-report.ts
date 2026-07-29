import { createClient } from "@/lib/supabase/server";

export interface ReportExportData {
  report: {
    id: string;
    reporting_period_name: string;
    reporting_period: string;
    status: string;
    outcome_progress: string | null;
    key_results: string | null;
    challenges: string | null;
    adaptive_actions: string | null;
    lessons_learned: string | null;
    next_period_priorities: string | null;
    created_at: string;
    departments: { name: string } | null;
  };
  activities: {
    description: string;
    expected_output: string;
    status: string;
    start_date: string;
    end_date: string;
    responsible_person: string | null;
    required_resources: string | null;
    anticipated_risks: string | null;
    mitigation_measures: string | null;
    outputs: { code: string; title: string } | null;
  }[];
  indicators: {
    title: string;
    unit: string;
    baseline: number;
    target: number;
    current_value: number;
  }[];
}

export async function fetchReportData(reportId: string): Promise<ReportExportData | null> {
  const supabase = await createClient();

  const { data: report } = await supabase
    .from("reports")
    .select("*, departments(name)")
    .eq("id", reportId)
    .single();

  if (!report) return null;

  const { data: activities } = await supabase
    .from("activities")
    .select("description, expected_output, status, start_date, end_date, responsible_person, required_resources, anticipated_risks, mitigation_measures, outputs(code, title)")
    .eq("department_id", report.department_id);

  // Normalise outputs — Supabase returns array for joins, we want single or null
  const normalisedActivities = (activities ?? []).map((a) => ({
    ...a,
    outputs: Array.isArray(a.outputs) ? (a.outputs[0] ?? null) : a.outputs,
  }));

  let indicatorQuery = supabase
    .from("outcome_indicators")
    .select("title, unit, baseline, target, current_value");

  if (report.department_id) {
    indicatorQuery = indicatorQuery.or(`responsible_department_id.is.null,responsible_department_id.eq.${report.department_id}`);
  }

  const { data: indicators } = await indicatorQuery;

  return {
    report,
    activities: normalisedActivities,
    indicators: indicators ?? [],
  };
}
