export type UserRole = "department_user" | "reporting_officer" | "management";
export type WorkPlanStatus = "draft" | "submitted" | "approved" | "rejected";
export type ActivityStatus = "planned" | "in_progress" | "completed" | "delayed" | "cancelled";
export type ReportStatus = "draft" | "submitted" | "reviewed" | "verified" | "approved" | "rejected";
export type EvidenceStatus = "pending" | "verified" | "requires_clarification" | "rejected";
export type PeriodType = "weekly" | "monthly" | "quarterly" | "annual";

export interface Department {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  department_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface StrategicObjective {
  id: string;
  code: string;
  title: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Outcome {
  id: string;
  strategic_objective_id: string;
  code: string;
  title: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface OutcomeIndicator {
  id: string;
  outcome_id: string;
  title: string;
  description: string | null;
  unit: string;
  baseline: number;
  target: number;
  current_value: number;
  created_at: string;
  updated_at: string;
}

export interface Output {
  id: string;
  outcome_id: string;
  code: string;
  title: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkPlan {
  id: string;
  department_id: string;
  period_type: PeriodType;
  period_name: string;
  status: WorkPlanStatus;
  created_at: string;
  updated_at: string;
}

export interface Activity {
  id: string;
  output_id: string;
  department_id: string;
  work_plan_id: string | null;
  description: string;
  expected_output: string;
  status: ActivityStatus;
  start_date: string;
  end_date: string;
  responsible_person: string | null;
  required_resources: string | null;
  anticipated_risks: string | null;
  mitigation_measures: string | null;
  created_at: string;
  updated_at: string;
}

export interface Indicator {
  id: string;
  activity_id: string;
  title: string;
  description: string | null;
  unit: string;
  baseline: number;
  target: number;
  current_value: number;
  created_at: string;
  updated_at: string;
}

export interface Evidence {
  id: string;
  title: string;
  file_path: string;
  file_size: number;
  file_type: string;
  uploaded_by: string | null;
  verification_status: EvidenceStatus;
  created_at: string;
  updated_at: string;
}

export interface Report {
  id: string;
  department_id: string;
  reporting_period: PeriodType;
  reporting_period_name: string;
  outcome_progress: string | null;
  key_results: string | null;
  challenges: string | null;
  adaptive_actions: string | null;
  lessons_learned: string | null;
  next_period_priorities: string | null;
  status: ReportStatus;
  created_at: string;
  updated_at: string;
}
