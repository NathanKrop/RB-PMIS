"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/notifications";

// ── Work Plans ────────────────────────────────────────────────────────────────

export async function createWorkPlan(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: profile } = await supabase.from("users").select("department_id").eq("id", user.id).single();
  if (!profile?.department_id) return { error: "No department assigned" };

  const { error } = await supabase.from("work_plans").insert({
    department_id: profile.department_id,
    created_by: user.id,
    period_type: formData.get("period_type") as string,
    period_name: formData.get("period_name") as string,
    status: "draft",
  });

  if (error) return { error: error.message };
  revalidatePath("/dashboard/department/work-plans");
}

export async function updateWorkPlanStatus(id: string, status: string) {
  const supabase = await createClient();
  const { data: wp } = await supabase.from("work_plans").select("period_name, department_id").eq("id", id).single();
  const { error } = await supabase.from("work_plans").update({ status }).eq("id", id);
  if (error) return { error: error.message };

  // Notify trainers in the department when officer approves/rejects
  if (wp && (status === "approved" || status === "rejected")) {
    const { data: trainers } = await supabase.from("users").select("id").eq("department_id", wp.department_id).eq("role", "department_user");
    for (const trainer of trainers ?? []) {
      await createNotification(trainer.id, `Work Plan ${status.charAt(0).toUpperCase() + status.slice(1)}`, `Your work plan "${wp.period_name}" has been ${status}.`, status === "rejected" ? "escalation" : "info");
    }
  }

  // Notify officers when trainer submits
  if (wp && status === "submitted") {
    const { data: officers } = await supabase.from("users").select("id").eq("role", "reporting_officer");
    for (const officer of officers ?? []) {
      await createNotification(officer.id, "Work Plan Submitted", `A work plan "${wp.period_name}" has been submitted for review.`, "info");
    }
  }

  revalidatePath("/dashboard/department/work-plans");
  revalidatePath("/dashboard/officer/reports");
  revalidatePath("/dashboard/management");
}

export async function createActivity(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: profile } = await supabase.from("users").select("department_id").eq("id", user.id).single();
  if (!profile?.department_id) return { error: "No department assigned" };

  const implementationSchedule = String(formData.get("implementation_schedule") ?? "")
    .split(",").map((month) => month.trim()).filter(Boolean).map((month) => ({ month, planned: "" }));
  const { error } = await supabase.from("activities").insert({
    output_id: formData.get("output_id") as string,
    department_id: profile.department_id,
    work_plan_id: formData.get("work_plan_id") as string || null,
    description: formData.get("description") as string,
    expected_output: formData.get("expected_output") as string,
    intended_outcome: formData.get("intended_outcome") as string || null,
    implementation_schedule: implementationSchedule,
    status: "planned",
    start_date: formData.get("start_date") as string,
    end_date: formData.get("end_date") as string,
    responsible_person: formData.get("responsible_person") as string || null,
    required_resources: formData.get("required_resources") as string || null,
    anticipated_risks: formData.get("anticipated_risks") as string || null,
    mitigation_measures: formData.get("mitigation_measures") as string || null,
    progress_update: formData.get("progress_update") as string || null,
    actual_achievement: formData.get("actual_achievement") as string || null,
    variance_analysis: formData.get("variance_analysis") as string || null,
  });

  if (error) return { error: error.message };
  revalidatePath("/dashboard/department/work-plans");
}

export async function updateActivityStatus(id: string, status: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("activities").update({ status }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/department/work-plans");
}

export async function updateActivityProgress(id: string, formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("activities").update({
    status: String(formData.get("status")),
    progress_update: String(formData.get("progress_update") ?? "").trim() || null,
    actual_achievement: String(formData.get("actual_achievement") ?? "").trim() || null,
    variance_analysis: String(formData.get("variance_analysis") ?? "").trim() || null,
  }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/department/work-plans");
}

// ── Reports ───────────────────────────────────────────────────────────────────

export async function createReport(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: profile } = await supabase.from("users").select("department_id").eq("id", user.id).single();
  if (!profile?.department_id) return { error: "No department assigned" };

  const { error } = await supabase.from("reports").insert({
    department_id: profile.department_id,
    reporting_period: formData.get("reporting_period") as string,
    reporting_period_name: formData.get("reporting_period_name") as string,
    work_plan_id: formData.get("work_plan_id") as string || null,
    outcome_progress: formData.get("outcome_progress") as string || null,
    key_results: formData.get("key_results") as string || null,
    challenges: formData.get("challenges") as string || null,
    adaptive_actions: formData.get("adaptive_actions") as string || null,
    lessons_learned: formData.get("lessons_learned") as string || null,
    next_period_priorities: formData.get("next_period_priorities") as string || null,
    status: "draft",
  });

  if (error) return { error: error.message };
  revalidatePath("/dashboard/department/reports");
}

export async function submitReport(id: string) {
  const supabase = await createClient();
  const { data: report } = await supabase.from("reports").select("reporting_period_name, department_id, outcome_progress, key_results, challenges, adaptive_actions, lessons_learned, next_period_priorities").eq("id", id).single();
  if (!report) return { error: "Report not found" };

  const missingFields: string[] = [];
  if (!report.outcome_progress) missingFields.push("Outcome Progress");
  if (!report.key_results) missingFields.push("Key Results");
  if (!report.challenges) missingFields.push("Challenges");
  if (!report.adaptive_actions) missingFields.push("Adaptive Actions");
  if (!report.lessons_learned) missingFields.push("Lessons Learned");
  if (!report.next_period_priorities) missingFields.push("Next Period Priorities");

  if (missingFields.length > 0) {
    return { error: `Report cannot be submitted until the following fields are completed: ${missingFields.join(", ")}.` };
  }

  const { error } = await supabase.from("reports").update({ status: "submitted" }).eq("id", id);
  if (error) return { error: error.message };

  // Notify all reporting officers
  const { data: officers } = await supabase.from("users").select("id").eq("role", "reporting_officer");
  for (const officer of officers ?? []) {
    await createNotification(officer.id, "New Report Submitted", `A report for "${report.reporting_period_name}" has been submitted for review.`, "info");
  }

  revalidatePath("/dashboard/department/reports");
  revalidatePath("/dashboard/officer/reports");
}

export async function updateReportStatus(id: string, status: string, rejectionReason?: string) {
  const supabase = await createClient();
  const { data: report } = await supabase.from("reports").select("reporting_period_name, department_id").eq("id", id).single();
  if (!report) return { error: "Report not found" };

  if (status === "rejected" && (!rejectionReason || !rejectionReason.trim())) {
    return { error: "A rejection reason is required when rejecting a report." };
  }

  const { error } = await supabase.rpc("update_report_status", {
    report_id: id,
    new_status: status,
    rejection_reason: status === "rejected" ? rejectionReason ?? null : null,
  });
  if (error) return { error: error.message };

  if (status === "reviewed") {
    const { data: trainers } = await supabase.from("users").select("id").eq("department_id", report.department_id).eq("role", "department_user");
    for (const trainer of trainers ?? []) {
      await createNotification(trainer.id, "Report Reviewed", `Your report "${report.reporting_period_name}" has been reviewed and is awaiting verification.`, "info");
    }
  }

  if (status === "verified") {
    const { data: managers } = await supabase.from("users").select("id").eq("role", "management");
    for (const manager of managers ?? []) {
      await createNotification(manager.id, "Report Verified", `A report for "${report.reporting_period_name}" is ready for approval.`, "info");
    }
  }

  if (status === "approved" || status === "rejected") {
    const { data: trainers } = await supabase.from("users").select("id").eq("department_id", report.department_id).eq("role", "department_user");
    const label = status === "approved" ? "approved" : "rejected";
    for (const trainer of trainers ?? []) {
      await createNotification(trainer.id, `Report ${label.charAt(0).toUpperCase() + label.slice(1)}`, `Your report "${report.reporting_period_name}" has been ${label}.`, status === "rejected" ? "escalation" : "info");
    }
  }

  revalidatePath("/dashboard/officer/reports");
  revalidatePath("/dashboard/management/reports");
  revalidatePath("/dashboard/department/reports");
}

// ── Evidence ──────────────────────────────────────────────────────────────────

export async function createReviewMeeting(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: profile } = await supabase.from("users").select("department_id").eq("id", user.id).single();
  if (!profile?.department_id) return { error: "No department assigned" };

  const { error } = await supabase.from("weekly_meetings").insert({
    department_id: profile.department_id,
    title: formData.get("title") as string,
    meeting_date: formData.get("meeting_date") as string,
    start_time: formData.get("start_time") as string,
    end_time: formData.get("end_time") as string || null,
    location: formData.get("location") as string || null,
    agenda: formData.get("agenda") as string,
    discussion_notes: formData.get("discussion_notes") as string || null,
    decisions: formData.get("decisions") as string || null,
    status: "scheduled",
    created_by: user.id,
  });

  if (error) return { error: error.message };
  revalidatePath("/dashboard/department/reviews");
}

export async function createReflection(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: profile } = await supabase.from("users").select("department_id").eq("id", user.id).single();
  if (!profile?.department_id) return { error: "No department assigned" };

  const { error } = await supabase.from("monthly_reflections").insert({
    department_id: profile.department_id,
    period_name: formData.get("period_name") as string,
    reflection_date: formData.get("reflection_date") as string,
    what_worked_well: formData.get("what_worked_well") as string || null,
    key_challenges: formData.get("key_challenges") as string || null,
    adaptive_actions_taken: formData.get("adaptive_actions_taken") as string || null,
    lessons_learned: formData.get("lessons_learned") as string || null,
    status: "draft",
    created_by: user.id,
  });

  if (error) return { error: error.message };
  revalidatePath("/dashboard/department/reviews");
}

export async function uploadEvidence(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const file = formData.get("file") as File;
  if (!file) return { error: "No file provided" };

  const filePath = `evidence/${user.id}/${Date.now()}_${file.name}`;
  const { error: uploadError } = await supabase.storage.from("evidence").upload(filePath, file);
  if (uploadError) return { error: uploadError.message };

  const lat = formData.get("latitude") ? Number(formData.get("latitude")) : null;
  const lng = formData.get("longitude") ? Number(formData.get("longitude")) : null;
  const { data: evidence, error } = await supabase.from("evidence").insert({
    title: formData.get("title") as string,
    file_path: filePath,
    file_size: file.size,
    file_type: file.type,
    uploaded_by: user.id,
    verification_status: "pending",
    caption: formData.get("caption") as string || null,
    location: formData.get("location") as string || null,
    latitude: lat && Number.isFinite(lat) ? lat : null,
    longitude: lng && Number.isFinite(lng) ? lng : null,
    activity_id: formData.get("activity_id") as string || null,
    document_type: formData.get("document_type") as string || null,
    keywords: formData.get("keywords") as string || null,
    reporting_period: formData.get("reporting_period") as string || null,
    captured_at: formData.get("captured_at") as string || null,
  }).select("id").single();

  if (error) return { error: error.message };
  if (evidence) {
    const links = [
      ["evidence_strategic_objectives", "strategic_objective_id", formData.get("strategic_objective_id")],
      ["evidence_outcomes", "outcome_id", formData.get("outcome_id")],
      ["evidence_outputs", "output_id", formData.get("output_id")],
      ["evidence_indicators", "indicator_id", formData.get("indicator_id")],
      ["evidence_reports", "report_id", formData.get("report_id")],
      ["evidence_activities", "activity_id", formData.get("activity_id")],
    ] as const;
    for (const [table, column, value] of links) {
      if (typeof value === "string" && value) await supabase.from(table).insert({ evidence_id: evidence.id, [column]: value });
    }
  }
  revalidatePath("/dashboard/department/evidence");
}

export async function updateEvidenceStatus(id: string, status: string, comments?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: evidence } = await supabase.from("evidence").select("title, uploaded_by").eq("id", id).single();
  const { error } = await supabase.from("evidence").update({ verification_status: status }).eq("id", id);
  if (error) return { error: error.message };

  await supabase.from("evidence_verifications").insert({
    evidence_id: id,
    status,
    reviewer_id: user.id,
    comments: comments || null,
  });

  // Notify the uploader
  if (evidence?.uploaded_by) {
    const label = status.replace(/_/g, " ");
    await createNotification(evidence.uploaded_by, `Evidence ${status === "verified" ? "Verified" : "Needs Attention"}`, `Your evidence "${evidence.title}" has been marked as ${label}.${comments ? ` Comment: ${comments}` : ""}`, status === "verified" ? "info" : "escalation");
  }

  revalidatePath("/dashboard/officer/evidence");
}

// ── Strategic Framework ───────────────────────────────────────────────────────

export async function createStrategicObjective(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("strategic_objectives").insert({
    code: formData.get("code") as string,
    title: formData.get("title") as string,
    description: formData.get("description") as string || null,
    responsible_department_id: formData.get("responsible_department_id") as string || null,
    reporting_frequency: formData.get("reporting_frequency") as string || null,
  });
  if (error) return { error: error.message };
  revalidatePath("/dashboard/officer/framework");
}

export async function createOutcome(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("outcomes").insert({
    strategic_objective_id: formData.get("strategic_objective_id") as string,
    code: formData.get("code") as string,
    title: formData.get("title") as string,
    description: formData.get("description") as string || null,
  });
  if (error) return { error: error.message };
  revalidatePath("/dashboard/officer/framework");
}

export async function createOutput(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("outputs").insert({
    outcome_id: formData.get("outcome_id") as string,
    code: formData.get("code") as string,
    title: formData.get("title") as string,
    description: formData.get("description") as string || null,
  });
  if (error) return { error: error.message };
  revalidatePath("/dashboard/officer/framework");
}

export async function createOutcomeIndicator(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("outcome_indicators").insert({
    outcome_id: formData.get("outcome_id") as string,
    title: formData.get("title") as string,
    description: formData.get("description") as string || null,
    unit: formData.get("unit") as string,
    baseline: Number(formData.get("baseline")),
    target: Number(formData.get("target")),
    current_value: Number(formData.get("current_value") || 0),
    responsible_department_id: formData.get("responsible_department_id") as string || null,
    reporting_frequency: formData.get("reporting_frequency") as string || null,
  });
  if (error) return { error: error.message };
  revalidatePath("/dashboard/officer/framework");
  revalidatePath("/dashboard/management/indicators");
}

export async function updateOutcomeIndicatorValue(id: string, current_value: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };
  if (!Number.isFinite(current_value) || current_value < 0) return { error: "Enter a valid non-negative value" };
  const { error } = await supabase.from("outcome_indicators").update({ current_value }).eq("id", id);
  if (error) return { error: error.message };
  const { error: historyError } = await supabase.from("indicator_value_history").insert({ indicator_id: id, value: current_value, recorded_by: user.id });
  if (historyError) return { error: historyError.message };
  revalidatePath("/dashboard/management/indicators");
  revalidatePath("/dashboard/officer/framework");
}

export async function updateOutcomeIndicator(id: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const baseline = Number(formData.get("baseline"));
  const target = Number(formData.get("target"));
  const currentValue = Number(formData.get("current_value"));
  if (![baseline, target, currentValue].every((value) => Number.isFinite(value) && value >= 0)) {
    return { error: "Baseline, target, and current value must be non-negative numbers" };
  }

  const { data: existing, error: readError } = await supabase.from("outcome_indicators").select("current_value").eq("id", id).single();
  if (readError) return { error: readError.message };
  const { error } = await supabase.from("outcome_indicators").update({
    title: String(formData.get("title") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim() || null,
    unit: String(formData.get("unit") ?? "").trim(), baseline, target, current_value: currentValue,
  }).eq("id", id);
  if (error) return { error: error.message };
  if (existing?.current_value !== currentValue) {
    const { error: historyError } = await supabase.from("indicator_value_history").insert({ indicator_id: id, value: currentValue, recorded_by: user.id });
    if (historyError) return { error: historyError.message };
  }
  revalidatePath("/dashboard/management/indicators");
  revalidatePath("/dashboard/officer/framework");
}

// ── Data Quality ─────────────────────────────────────────────────────────────

export async function logDataQualityCheck(input: {
  departmentId: string | null;
  checkType: "completeness" | "anomaly" | "duplicate";
  entity: string;
  issue: string;
  severity: "low" | "medium" | "high";
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };
  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (profile?.role !== "reporting_officer") return { error: "Only reporting officers can log issues" };
  if (!input.entity.trim() || !input.issue.trim()) return { error: "Invalid issue details" };

  let query = supabase.from("data_quality_checks").select("id").eq("resolved", false)
    .eq("check_type", input.checkType).eq("entity", input.entity).eq("issue", input.issue);
  query = input.departmentId ? query.eq("department_id", input.departmentId) : query.is("department_id", null);
  const { data: duplicate, error: duplicateError } = await query.maybeSingle();
  if (duplicateError) return { error: duplicateError.message };
  if (duplicate) return { error: "This issue is already logged" };

  const { error } = await supabase.from("data_quality_checks").insert({
    checked_by: user.id, department_id: input.departmentId, check_type: input.checkType,
    entity: input.entity.trim(), issue: input.issue.trim(), severity: input.severity,
  });
  if (error) return { error: error.message };
  revalidatePath("/dashboard/officer/data-quality");
  revalidatePath("/dashboard/management/data-quality");
}

export async function resolveDataQualityCheck(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("data_quality_checks").update({ resolved: true }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/officer/data-quality");
  revalidatePath("/dashboard/management/data-quality");
}

// ── Knowledge Repository ─────────────────────────────────────────────────────

export async function createRisk(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };
  const effectiveness = Number(formData.get("mitigation_effectiveness") ?? 0);
  if (!Number.isInteger(effectiveness) || effectiveness < 0 || effectiveness > 100) return { error: "Effectiveness must be between 0 and 100" };
  const { error } = await supabase.from("risks").insert({
    department_id: String(formData.get("department_id")) || null, title: String(formData.get("title")).trim(),
    description: String(formData.get("description")) || null, category: String(formData.get("category")) || "operational",
    likelihood: formData.get("likelihood"), impact: formData.get("impact"), status: formData.get("status"),
    owner: String(formData.get("owner")) || null, mitigation_plan: String(formData.get("mitigation_plan")) || null,
    mitigation_effectiveness: effectiveness, due_date: String(formData.get("due_date")) || null, created_by: user.id,
  });
  if (error) return { error: error.message };
  revalidatePath("/dashboard/officer/risks"); revalidatePath("/dashboard/management/risks");
}

export async function updateRiskStatus(id: string, status: "open" | "mitigating" | "escalated" | "closed", effectiveness: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !Number.isInteger(effectiveness) || effectiveness < 0 || effectiveness > 100) return { error: "Invalid update" };
  const { error } = await supabase.from("risks").update({ status, mitigation_effectiveness: effectiveness }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/officer/risks"); revalidatePath("/dashboard/management/risks");
}

export async function createKnowledgeItem(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase.from("knowledge_items").insert({
    title: formData.get("title") as string,
    category: formData.get("category") as string,
    content: formData.get("content") as string,
    tags: formData.get("tags") as string || null,
    period_reference: formData.get("period_reference") as string || null,
    department_id: formData.get("department_id") as string || null,
    created_by: user.id,
  });

  if (error) return { error: error.message };
  revalidatePath("/dashboard/officer/knowledge");
  revalidatePath("/dashboard/management/knowledge");
  revalidatePath("/dashboard/department/knowledge");
}

export async function deleteKnowledgeItem(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("knowledge_items").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/officer/knowledge");
  revalidatePath("/dashboard/management/knowledge");
  revalidatePath("/dashboard/department/knowledge");
}

// ── Beneficiaries ────────────────────────────────────────────────────────────

export async function createBeneficiary(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };
  const { data: profile } = await supabase.from("users").select("department_id").eq("id", user.id).single();
  const deptId = formData.get("department_id") as string || profile?.department_id;
  if (!deptId) return { error: "No department assigned" };
  const age = formData.get("age") ? Number(formData.get("age")) : null;
  const { error } = await supabase.from("beneficiaries").insert({
    full_name: (formData.get("full_name") as string).trim(),
    gender: formData.get("gender") as string || null,
    age: age && Number.isFinite(age) ? age : null,
    location: formData.get("location") as string || null,
    contact: formData.get("contact") as string || null,
    department_id: deptId,
    activity_id: formData.get("activity_id") as string || null,
    feedback: formData.get("feedback") as string || null,
    testimonial: formData.get("testimonial") as string || null,
    registered_by: user.id,
  });
  if (error) return { error: error.message };
  revalidatePath("/dashboard/department/beneficiaries");
  revalidatePath("/dashboard/officer/beneficiaries");
  revalidatePath("/dashboard/management/beneficiaries");
}

export async function deleteBeneficiary(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("beneficiaries").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/department/beneficiaries");
  revalidatePath("/dashboard/officer/beneficiaries");
  revalidatePath("/dashboard/management/beneficiaries");
}

// ── Resources ─────────────────────────────────────────────────────────────────

export async function createResource(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };
  const { data: profile } = await supabase.from("users").select("department_id").eq("id", user.id).single();
  const deptId = formData.get("department_id") as string || profile?.department_id;
  if (!deptId) return { error: "No department assigned" };
  const { error } = await supabase.from("resources").insert({
    department_id: deptId,
    activity_id: formData.get("activity_id") as string || null,
    title: (formData.get("title") as string).trim(),
    category: formData.get("category") as string,
    unit: (formData.get("unit") as string).trim(),
    quantity_planned: Number(formData.get("quantity_planned") || 0),
    quantity_used: Number(formData.get("quantity_used") || 0),
    unit_cost: Number(formData.get("unit_cost") || 0),
    period_reference: formData.get("period_reference") as string || null,
    notes: formData.get("notes") as string || null,
    created_by: user.id,
  });
  if (error) return { error: error.message };
  revalidatePath("/dashboard/department/resources");
  revalidatePath("/dashboard/officer/resources");
  revalidatePath("/dashboard/management/resources");
}

export async function updateResourceUsage(id: string, quantity_used: number) {
  const supabase = await createClient();
  if (!Number.isFinite(quantity_used) || quantity_used < 0) return { error: "Invalid quantity" };
  const { error } = await supabase.from("resources").update({ quantity_used }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/department/resources");
  revalidatePath("/dashboard/officer/resources");
  revalidatePath("/dashboard/management/resources");
}

export async function deleteResource(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("resources").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/department/resources");
  revalidatePath("/dashboard/officer/resources");
  revalidatePath("/dashboard/management/resources");
}

// ── Departments (Officer) ─────────────────────────────────────────────────────

export async function createDepartment(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("departments").insert({
    name: String(formData.get("name") ?? "").trim(),
    parent_department_id: String(formData.get("parent_department_id") ?? "") || null,
  });
  if (error) return { error: error.message };
  revalidatePath("/dashboard/officer/departments");
}

export async function updateUserDepartment(userId: string, departmentId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("users").update({ department_id: departmentId }).eq("id", userId);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/officer/departments");
}

export async function runDeadlineScheduler() {
  const res = await fetch("/api/automation/deadlines", {
    method: "POST",
  });
  if (!res.ok) {
    const payload = await res.json();
    return { error: payload?.error ?? "Scheduler failed" };
  }
  return await res.json();
}

export async function createReportingDeadline(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };
  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (profile?.role !== "reporting_officer") return { error: "Only reporting officers can create deadlines" };
  const { error } = await supabase.from("reporting_deadlines").insert({
    department_id: String(formData.get("department_id")),
    reporting_period: String(formData.get("reporting_period")),
    reporting_period_name: String(formData.get("reporting_period_name")).trim(),
    due_date: String(formData.get("due_date")),
    reminder_days: Number(formData.get("reminder_days") ?? 3),
    escalation_days: Number(formData.get("escalation_days") ?? 1),
    created_by: user.id,
  });
  if (error) return { error: error.message };
  revalidatePath("/dashboard/officer/deadlines");
}
