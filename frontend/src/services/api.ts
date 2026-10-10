import axios from 'axios';
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

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1',
});

export function apiErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const d = err.response?.data as { detail?: unknown } | undefined;
    if (d?.detail && typeof d.detail === 'string') return d.detail;
    if (d?.detail && typeof d.detail === 'object' && 'detail' in (d.detail as object)) {
      const inner = d.detail as { detail?: string; code?: string };
      return `${inner.detail ?? 'Request failed'}${inner.code ? ` (${inner.code})` : ''}`;
    }
    return err.message;
  }
  return 'Unexpected error';
}

export const machinesApi = {
  list: (params: { search?: string; status?: string; process?: string; page?: number; page_size?: number }) =>
    api.get<Page<MachineListItem>>('/machines', { params }).then((r) => r.data),
  get: (id: number) => api.get<MachineDetail>(`/machines/${id}`).then((r) => r.data),
  statusEvents: (id: number) => api.get<StatusEvent[]>(`/machines/${id}/status-events`).then((r) => r.data),
  changeStatus: (id: number, status: string, reason?: string) =>
    api.patch<Machine>(`/machines/${id}/status`, { status, reason }).then((r) => r.data),
  create: (body: Record<string, unknown>) => api.post<Machine>('/machines', body).then((r) => r.data),
};

export const productionApi = {
  dashboard: () => api.get<Dashboard>('/production/dashboard').then((r) => r.data),
  jobs: (params: { machine_id?: number; status?: string; page?: number; page_size?: number }) =>
    api.get<Page<Job>>('/production/jobs', { params }).then((r) => r.data),
  job: (id: number) => api.get<JobDetail>(`/production/jobs/${id}`).then((r) => r.data),
  createJob: (body: Record<string, unknown>) => api.post<Job>('/production/jobs', body).then((r) => r.data),
  act: (id: number, action: 'start' | 'pause' | 'resume' | 'complete' | 'cancel', note?: string) =>
    api.post<Job>(`/production/jobs/${id}/${action}`, { note }).then((r) => r.data),
  progress: (id: number, actual_quantity: number) =>
    api.patch<Job>(`/production/jobs/${id}/progress`, { actual_quantity }).then((r) => r.data),
  downtime: (params: { machine_id?: number }) =>
    api.get<Downtime[]>('/production/downtime', { params }).then((r) => r.data),
  addDowntime: (body: Record<string, unknown>) => api.post<Downtime>('/production/downtime', body).then((r) => r.data),
};

export const recommendationsApi = {
  generate: (body: {
    order_ref: string;
    required_process: string;
    required_material: string;
    required_quantity: number;
    deadline?: string;
  }) => api.post<Recommendation>('/recommendations/machines', body).then((r) => r.data),
  get: (id: number) => api.get<Recommendation>(`/recommendations/machines/${id}`).then((r) => r.data),
  approve: (id: number, body: { decided_by: string; note?: string }) =>
    api.post<Recommendation>(`/recommendations/machines/${id}/approve`, body).then((r) => r.data),
};

export const analyticsApi = {
  query: (params: { date_from?: string; date_to?: string; machine_id?: number }) =>
    api.get<AnalyticsRow[]>('/production/analytics', { params }).then((r) => r.data),
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
  }) => api.post<DurationEstimateOut>('/scheduling/estimate-duration', body).then((r) => r.data),
  machineTimeline: (id: number) =>
    api.get<MachineTimelineOut>(`/scheduling/machines/${id}/timeline`).then((r) => r.data),
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
  }) => api.get<Page<InspectionWire>>('/quality/inspections', { params }).then((r) => r.data),
  inspection: (id: number) => api.get<InspectionWire>(`/quality/inspections/${id}`).then((r) => r.data),
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
  }) => api.post<InspectionWire>('/quality/inspections', body).then((r) => r.data),
  updateInspection: (id: number, body: { outcome?: string; remarks?: string }) =>
    api.patch<InspectionWire>(`/quality/inspections/${id}`, body).then((r) => r.data),
  dashboard: () => api.get<DashboardBundleWire>('/quality/dashboard').then((r) => r.data),
  rollPreview: (jobId: number) =>
    api.get<{ job_id: number; batch_no: string; roll_id: string; inspection_count: number }>(
      `/quality/jobs/${jobId}/roll-preview`,
    ).then((r) => r.data),
  inspectableJob: (machineId: number) =>
    api.get<ActiveJobWire | null>(`/quality/machines/${machineId}/inspectable-job`).then((r) => r.data),
  inspectionCounts: () =>
    api.get<{ job_id: number; count: number; latest_inspection_id: number | null }[]>(
      '/quality/inspection-counts',
    ).then((r) => r.data),
};
