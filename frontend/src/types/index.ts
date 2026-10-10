export type MachineStatus = 'RUNNING' | 'IDLE' | 'MAINTENANCE';
export type JobStatus = 'PLANNED' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
export type RecommendationDecision = 'PENDING' | 'APPROVED' | 'REJECTED' | 'FAILED_REVALIDATION';

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface CurrentAssignment {
  job_id: number;
  order_ref: string;
  material_spec: string;
  required_process: string;
  planned_quantity: number;
  actual_quantity: number;
  quantity_unit: string;
  status: JobStatus;
  completion_percent: number;
  planned_start: string | null;
  planned_end: string | null;
}

export interface MachineListItem {
  id: number;
  code: string;
  name: string;
  machine_type: string;
  supported_processes: string;
  capacity_value: number;
  capacity_unit: string;
  status: MachineStatus;
  current_assignment: CurrentAssignment | null;
  available_for_assignment: boolean;
  efficiency_percent: number | null;
}

export interface Machine extends MachineListItem {
  compatible_materials: string;
  status_reason: string | null;
  status_changed_at: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface MachineDetail extends Machine {
  current_assignment: CurrentAssignment | null;
  available_for_assignment: boolean;
}

export interface StatusEvent {
  id: number;
  machine_id: number;
  from_status: MachineStatus | null;
  to_status: MachineStatus;
  reason: string | null;
  created_at: string;
}

export interface Job {
  id: number;
  machine_id: number;
  order_ref: string;
  material_spec: string;
  required_process: string;
  planned_quantity: number;
  actual_quantity: number;
  quantity_unit: string;
  shift: string | null;
  status: JobStatus;
  completion_percent: number;
  planned_start: string | null;
  planned_end: string | null;
  actual_start: string | null;
  actual_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface Downtime {
  id: number;
  machine_id: number;
  job_id: number | null;
  reason: string;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
}

export interface JobDetail extends Job {
  status_events: { id: number; from_status: JobStatus | null; to_status: JobStatus; note: string | null; created_at: string }[];
  downtimes: Downtime[];
}

export interface Dashboard {
  total_machines: number;
  running: number;
  idle: number;
  maintenance: number;
  active_jobs: number;
  completed_jobs: number;
  delayed_jobs: number;
  output_today: number;
}

export interface ScoreBreakdown {
  efficiency: number | null;
  efficiency_known: boolean;
  workload_suitability: number;
  quality: number | null;
  quality_known: boolean;
  final_score: number;
}

export interface Candidate {
  machine_id: number;
  machine_code: string;
  machine_name: string;
  eligible: boolean;
  exclusion_reasons: string[];
  score: ScoreBreakdown | null;
  estimated_days: number | null;
}

export interface Recommendation {
  id: number;
  order_ref: string;
  required_process: string;
  required_material: string;
  required_quantity: number;
  quantity_unit: string;
  algorithm_version: string;
  decision: RecommendationDecision;
  recommended_machine_id: number | null;
  recommended_machine_code: string | null;
  explanation: string;
  warnings: string[];
  candidates: Candidate[];
  material_available: boolean | null;
  material_note: string;
  created_at: string;
  decided_by: string | null;
  decided_at: string | null;
  assigned_job_id: number | null;
}

export interface AnalyticsRow {
  machine_id: number;
  machine_code: string;
  machine_name: string;
  planned_quantity: number;
  actual_quantity: number;
  completion_percent: number;
  job_count: number;
  completed_jobs: number;
  efficiency_percent: number | null;
  utilization_percent: number | null;
  downtime_minutes: number;
  downtime_reasons: Record<string, number>;
  defect_rate_percent: number | null;
  defect_note: string | null;
}
