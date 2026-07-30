"use server";

import { createClient } from "@/lib/supabase/server";
import type { ReportDraft } from "@/lib/types";

export async function buildReportDraft(workPlanId: string): Promise<ReportDraft | null> {
  const supabase = await createClient();

  const { data: workPlan } = await supabase
    .from("work_plans")
    .select("id, period_name, period_type, status, department_id")
    .eq("id", workPlanId)
    .single();

  if (!workPlan) {
    return null;
  }

  const [{ data: activities }, { data: outputs }] = await Promise.all([
    supabase
      .from("activities")
      .select("id, description, status, output_id, required_resources, anticipated_risks, mitigation_measures")
      .eq("work_plan_id", workPlanId),
    supabase.from("outputs").select("id, code, title, outcome_id"),
  ]);

  const allActivities = activities ?? [];
  const completedCount = allActivities.filter((item) => item.status === "completed").length;
  const inProgressCount = allActivities.filter((item) => item.status === "in_progress").length;
  const plannedCount = allActivities.filter((item) => item.status === "planned").length;
  const delayedCount = allActivities.filter((item) => item.status === "delayed").length;
  const cancelledCount = allActivities.filter((item) => item.status === "cancelled").length;

  const outputMap = new Map((outputs ?? []).map((output) => [output.id, output]));
  const outputSummary = new Map<string, number>();
  for (const activity of allActivities) {
    const output = outputMap.get(activity.output_id);
    const key = output ? `${output.code}: ${output.title}` : activity.output_id;
    outputSummary.set(key, (outputSummary.get(key) ?? 0) + 1);
  }

  const topOutputLines = Array.from(outputSummary.entries())
    .slice(0, 4)
    .map(([key, count]) => `${count} activity(ies) under ${key}`);

  const challengeActivities = allActivities.filter((item) => item.status === "delayed" || item.status === "cancelled" || item.required_resources || item.anticipated_risks);
  const challengeLines = challengeActivities.slice(0, 3).map((item) => `• ${item.description}`);

  const keyResultLines = allActivities
    .filter((item) => item.status === "completed")
    .slice(0, 3)
    .map((item) => `• ${item.description}`);

  const resourceIssues = allActivities.filter((item) => item.required_resources && item.status !== "completed");
  const riskIssues = allActivities.filter((item) => item.anticipated_risks || item.mitigation_measures);

  const outcomeProgress = `This work plan has ${allActivities.length} activities: ${completedCount} completed, ${inProgressCount} in progress, ${plannedCount} planned, ${delayedCount} delayed, and ${cancelledCount} cancelled. ${topOutputLines.length > 0 ? `Key focus areas include ${topOutputLines.join(", ")}.` : ""}`;

  const keyResults = keyResultLines.length > 0
    ? `Completed activities include:\n${keyResultLines.join("\n")}`
    : `Key results are still emerging from planned and in-progress activities.`;

  const challenges = challengeLines.length > 0
    ? `Current challenges are visible in these activities:\n${challengeLines.join("\n")}`
    : `No major activity-level challenges were detected yet, but continue monitoring implementation risks and resource needs.`;

  const adaptiveActions = [`Strengthen weekly monitoring for delayed activities.`, `Prioritise resource allocation to activities with outstanding requirements.`, `Update implementation schedules for work plan activities where needed.`].join(" ");

  const lessonsLearned = [`Capture verification evidence continuously as activities progress.`, `Use the work plan status dashboard to identify activities that require follow-up.`, `Keep communication channels open between task owners and programme managers.`].join(" ");

  const nextPeriodPriorities = [`Finalize the remaining activities for this reporting period.`, `Verify evidence for completed outputs and close any outstanding quality gaps.`, `Translate activity progress into consolidated report narratives for outcomes and priorities.`].join(" ");

  return {
    work_plan_id: workPlan.id,
    reporting_period_name: workPlan.period_name,
    reporting_period: workPlan.period_type,
    outcome_progress: outcomeProgress,
    key_results: keyResults,
    challenges,
    adaptive_actions: adaptiveActions,
    lessons_learned: lessonsLearned,
    next_period_priorities: nextPeriodPriorities,
  };
}
