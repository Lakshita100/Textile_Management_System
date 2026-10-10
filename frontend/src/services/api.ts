import axios from 'axios';
import type {
  AnalyticsRow,
  Dashboard,
  Downtime,
  Job,
  JobDetail,
  Machine,
  MachineDetail,
  MachineListItem,
  Page,
  Recommendation,
  StatusEvent,
} from '../types';

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
