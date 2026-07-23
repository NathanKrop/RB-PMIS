export type UserRole = "department_user" | "reporting_officer" | "management";
export type WorkPlanStatus = "draft" | "submitted" | "approved" | "rejected";
export type ActivityStatus = "planned" | "in_progress" | "completed" | "delayed" | "cancelled";
export type ReportStatus = "draft" | "submitted" | "reviewed" | "verified" | "approved" | "rejected";
export type EvidenceStatus = "pending" | "verified" | "requires_clarification" | "rejected";
export type PeriodType = "weekly" | "monthly" | "quarterly" | "annual";
export type KnowledgeCategory = "lessons_learned" | "best_practice" | "case_study" | "success_story";
export type RiskLevel = "low" | "medium" | "high";
export type RiskStatus = "open" | "mitigating" | "escalated" | "closed";

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
  responsible_department_id: string | null;
  reporting_frequency: PeriodType | null;
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
  responsible_department_id: string | null;
  reporting_frequency: PeriodType | null;
  created_at: string;
  updated_at: string;
}

export interface IndicatorValueHistory {
  id: string;
  indicator_id: string;
  value: number;
  recorded_by: string | null;
  recorded_at: string;
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
  intended_outcome: string | null;
  implementation_schedule: { month: string; planned: string }[];
  progress_update: string | null;
  actual_achievement: string | null;
  variance_analysis: string | null;
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
  caption: string | null;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  activity_id: string | null;
  document_type: string | null;
  keywords: string | null;
  reporting_period: string | null;
  captured_at: string | null;
  version_group: string;
  version_number: number;
  parent_evidence_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface DataQualityCheck {
  id: string;
  checked_by: string | null;
  department_id: string | null;
  check_type: "completeness" | "anomaly" | "duplicate";
  entity: string;
  issue: string;
  severity: "low" | "medium" | "high";
  resolved: boolean;
  created_at: string;
}

export interface Risk {
  id: string;
  department_id: string | null;
  title: string;
  description: string | null;
  category: string;
  likelihood: RiskLevel;
  impact: RiskLevel;
  status: RiskStatus;
  owner: string | null;
  mitigation_plan: string | null;
  mitigation_effectiveness: number;
  due_date: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeItem {
  id: string;
  title: string;
  category: KnowledgeCategory;
  content: string;
  tags: string | null;
  period_reference: string | null;
  department_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Beneficiary {
  id: string;
  full_name: string;
  gender: "male" | "female" | "other" | null;
  age: number | null;
  location: string | null;
  contact: string | null;
  department_id: string | null;
  activity_id: string | null;
  feedback: string | null;
  testimonial: string | null;
  registered_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Resource {
  id: string;
  department_id: string;
  activity_id: string | null;
  title: string;
  category: "human" | "financial" | "material" | "equipment";
  unit: string;
  quantity_planned: number;
  quantity_used: number;
  unit_cost: number;
  period_reference: string | null;
  notes: string | null;
  created_by: string | null;
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

export interface ReportingDeadline {
  id: string;
  department_id: string;
  reporting_period: PeriodType;
  reporting_period_name: string;
  due_date: string;
  reminder_days: number;
  escalation_days: number;
  created_by: string | null;
  created_at: string;
}
