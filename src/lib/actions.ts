"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// ── Work Plans ────────────────────────────────────────────────────────────────

export async function createWorkPlan(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: profile } = await supabase.from("users").select("department_id").eq("id", user.id).single();
  if (!profile?.department_id) return { error: "No department assigned" };

  const { error } = await supabase.from("work_plans").insert({
    department_id: profile.department_id,
    period_type: formData.get("period_type") as string,
    period_name: formData.get("period_name") as string,
    status: "draft",
  });

  if (error) return { error: error.message };
  revalidatePath("/dashboard/department/work-plans");
}

export async function updateWorkPlanStatus(id: string, status: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("work_plans").update({ status }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/department/work-plans");
  revalidatePath("/dashboard/officer/reports");
}

export async function createActivity(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: profile } = await supabase.from("users").select("department_id").eq("id", user.id).single();
  if (!profile?.department_id) return { error: "No department assigned" };

  const { error } = await supabase.from("activities").insert({
    output_id: formData.get("output_id") as string,
    department_id: profile.department_id,
    work_plan_id: formData.get("work_plan_id") as string || null,
    description: formData.get("description") as string,
    expected_output: formData.get("expected_output") as string,
    status: "planned",
    start_date: formData.get("start_date") as string,
    end_date: formData.get("end_date") as string,
    responsible_person: formData.get("responsible_person") as string || null,
    required_resources: formData.get("required_resources") as string || null,
    anticipated_risks: formData.get("anticipated_risks") as string || null,
    mitigation_measures: formData.get("mitigation_measures") as string || null,
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
  const { error } = await supabase.from("reports").update({ status: "submitted" }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/department/reports");
  revalidatePath("/dashboard/officer/reports");
}

export async function updateReportStatus(id: string, status: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("reports").update({ status }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/officer/reports");
  revalidatePath("/dashboard/management/reports");
}

// ── Evidence ──────────────────────────────────────────────────────────────────

export async function uploadEvidence(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const file = formData.get("file") as File;
  if (!file) return { error: "No file provided" };

  const filePath = `evidence/${user.id}/${Date.now()}_${file.name}`;
  const { error: uploadError } = await supabase.storage.from("evidence").upload(filePath, file);
  if (uploadError) return { error: uploadError.message };

  const { error } = await supabase.from("evidence").insert({
    title: formData.get("title") as string,
    file_path: filePath,
    file_size: file.size,
    file_type: file.type,
    uploaded_by: user.id,
    verification_status: "pending",
  });

  if (error) return { error: error.message };
  revalidatePath("/dashboard/department/evidence");
}

export async function updateEvidenceStatus(id: string, status: string, comments?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase.from("evidence").update({ verification_status: status }).eq("id", id);
  if (error) return { error: error.message };

  await supabase.from("evidence_verifications").insert({
    evidence_id: id,
    status,
    reviewer_id: user.id,
    comments: comments || null,
  });

  revalidatePath("/dashboard/officer/evidence");
}

// ── Strategic Framework ───────────────────────────────────────────────────────

export async function createStrategicObjective(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("strategic_objectives").insert({
    code: formData.get("code") as string,
    title: formData.get("title") as string,
    description: formData.get("description") as string || null,
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
  });
  if (error) return { error: error.message };
  revalidatePath("/dashboard/officer/framework");
  revalidatePath("/dashboard/management/indicators");
}

export async function updateOutcomeIndicatorValue(id: string, current_value: number) {
  const supabase = await createClient();
  const { error } = await supabase.from("outcome_indicators").update({ current_value }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/management/indicators");
  revalidatePath("/dashboard/officer/framework");
}

// ── Departments (Officer) ─────────────────────────────────────────────────────

export async function createDepartment(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("departments").insert({
    name: formData.get("name") as string,
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
