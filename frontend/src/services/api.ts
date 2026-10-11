import { http, ApiError } from './http';
import type {
  AnalyticsRow,
  Dashboard,
  Downtime,
  DurationEstimateOut,
  Job,
  JobDetail,
  Machine,
  MachineDetail,
  MachineListItem,
  MachineTimelineOut,
  Page,
  Recommendation,
  StatusEvent,
} from '../types';
import type { ActiveJobWire, DashboardBundleWire, InspectionWire } from '../types/quality';

export function apiErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    return err.message;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return 'Unexpected error';
}

function buildQueryString(params?: Record<string, string | number | undefined>): string {
  if (!params) return '';
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      searchParams.append(key, String(value));
    }
  });
  const str = searchParams.toString();
  return str ? `?${str}` : '';
}

export const machinesApi = {
  list: (params: { search?: string; status?: string; process?: string; page?: number; page_size?: number }) =>
    http.get<Page<MachineListItem>>(`/machines${buildQueryString(params)}`),
  get: (id: number) => http.get<MachineDetail>(`/machines/${id}`),
  statusEvents: (id: number) => http.get<StatusEvent[]>(`/machines/${id}/status-events`),
  changeStatus: (id: number, status: string, reason?: string) =>
    http.patch<Machine>(`/machines/${id}/status`, { status, reason }),
  create: (body: Record<string, unknown>) => http.post<Machine>('/machines', body),
};

export const productionApi = {
  dashboard: () => http.get<Dashboard>('/production/dashboard'),
  jobs: (params: { machine_id?: number; status?: string; order_ref?: string; page?: number; page_size?: number }) =>
    http.get<Page<Job>>(`/production/jobs${buildQueryString(params)}`),
  job: (id: number) => http.get<JobDetail>(`/production/jobs/${id}`),
  createJob: (body: Record<string, unknown>) => http.post<Job>('/production/jobs', body),
  act: (id: number, action: 'start' | 'pause' | 'resume' | 'complete' | 'cancel', note?: string) =>
    http.post<Job>(`/production/jobs/${id}/${action}`, { note }),
  progress: (id: number, actual_quantity: number) =>
    http.patch<Job>(`/production/jobs/${id}/progress`, { actual_quantity }),
  downtime: (params: { machine_id?: number }) =>
    http.get<Downtime[]>(`/production/downtime${buildQueryString(params)}`),
  addDowntime: (body: Record<string, unknown>) => http.post<Downtime>('/production/downtime', body),
};

export const recommendationsApi = {
  generate: (body: {
    order_ref: string;
    required_process: string;
    required_material: string;
    required_quantity: number;
    deadline?: string;
  }) => http.post<Recommendation>('/recommendations/machines', body),
  get: (id: number) => http.get<Recommendation>(`/recommendations/machines/${id}`),
  approve: (id: number, body: { decided_by: string; note?: string }) =>
    http.post<Recommendation>(`/recommendations/machines/${id}/approve`, body),
};

export const analyticsApi = {
  query: (params: { date_from?: string; date_to?: string; machine_id?: number }) =>
    http.get<AnalyticsRow[]>(`/production/analytics${buildQueryString(params)}`),
};

export const schedulingApi = {
  estimateDuration: (body: {
    machine_id: number;
    quantity: number;
    unit?: string;
    process: string;
    gsm?: number;
    width_cm?: number;
    fabric_type?: string;
    priority?: string;
  }) => http.post<DurationEstimateOut>('/scheduling/estimate-duration', body),
  machineTimeline: (id: number) =>
    http.get<MachineTimelineOut>(`/scheduling/machines/${id}/timeline`),
};

export const qualityApi = {
  inspections: (params: {
    search?: string;
    outcome?: string;
    machine_code?: string;
    employee_id?: string;
    job_id?: number;
    page?: number;
    page_size?: number;
  }) => http.get<Page<InspectionWire>>(`/quality/inspections${buildQueryString(params)}`),
  inspection: (id: number) => http.get<InspectionWire>(`/quality/inspections/${id}`),
  createInspection: (body: {
    job_id: number;
    employee_id: string;
    inspector_name: string;
    inspected_at: string;
    inspected_qty_meters: number;
    defects: { type: string; count: number; severity: string; remarks?: string }[];
    remarks?: string;
    machine_code?: string;
    order_ref?: string;
    batch_no?: string;
  }) => http.post<InspectionWire>('/quality/inspections', body),
  updateInspection: (id: number, body: { outcome?: string; remarks?: string }) =>
    http.patch<InspectionWire>(`/quality/inspections/${id}`, body),
  dashboard: () => http.get<DashboardBundleWire>('/quality/dashboard'),
  rollPreview: (jobId: number) =>
    http.get<{ job_id: number; batch_no: string; roll_id: string; inspection_count: number }>(
      `/quality/jobs/${jobId}/roll-preview`,
    ),
  inspectableJob: (machineId: number) =>
    http.get<ActiveJobWire | null>(`/quality/machines/${machineId}/inspectable-job`),
  inspectionCounts: () =>
    http.get<{ job_id: number; count: number; latest_inspection_id: number | null }[]>(
      '/quality/inspection-counts',
    ),
};
