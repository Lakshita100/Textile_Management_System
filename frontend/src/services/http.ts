/**
 * Minimal HTTP client for the FastAPI backend.
 * Base URL: same origin (Vite dev/preview proxy forwards /api → :8000),
 * overridable with VITE_API_BASE_URL for deployments.
 */

const BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '');

const DEFAULT_TIMEOUT_MS = 15_000;

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  timeoutMs?: number;
  /** Send FormData as-is instead of JSON. */
  formData?: FormData;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, formData, timeoutMs = DEFAULT_TIMEOUT_MS, headers, ...rest } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const init: RequestInit = {
      ...rest,
      signal: controller.signal,
      headers: { Accept: 'application/json', ...headers },
    };
    if (formData) {
      init.body = formData;
    } else if (body !== undefined) {
      init.headers = { 'Content-Type': 'application/json', ...(init.headers as Record<string, string>) };
      init.body = JSON.stringify(body);
    }

    const response = await fetch(`${BASE}/api/v1${path}`, init);

    if (response.status === 204) {
      return undefined as T;
    }

    const text = await response.text();
    let payload: unknown = null;
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = null;
      }
    }

    if (!response.ok) {
      const detail =
        payload && typeof payload === 'object' && 'detail' in payload
          ? String((payload as { detail: unknown }).detail)
          : response.statusText || `HTTP ${response.status}`;
      throw new ApiError(response.status, detail);
    }

    return payload as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError(0, 'The request timed out — is the backend running on port 8000?');
    }
    throw new ApiError(0, `Network error — could not reach the API (${(error as Error).message})`);
  } finally {
    clearTimeout(timer);
  }
}

export const http = {
  get: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: 'DELETE' }),
  upload: <T>(path: string, formData: FormData, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'POST', formData, timeoutMs: options?.timeoutMs ?? 60_000 }),

  /** Fetch a binary payload (e.g. a CSV export) as a Blob. */
  async getBlob(
    path: string,
    options: Omit<RequestInit, 'body'> & { timeoutMs?: number } = {},
  ): Promise<Blob> {
    const { timeoutMs = 60_000, headers, ...rest } = options;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(`${BASE}/api/v1${path}`, {
        ...rest,
        signal: controller.signal,
        headers: { Accept: 'text/csv,*/*', ...headers },
      });
      if (!response.ok) {
        let detail = response.statusText || `HTTP ${response.status}`;
        try {
          const payload = (await response.json()) as { detail?: unknown };
          if (payload?.detail) detail = String(payload.detail);
        } catch {
          /* keep status text */
        }
        throw new ApiError(response.status, detail);
      }
      return await response.blob();
    } catch (error) {
      if (error instanceof ApiError) throw error;
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new ApiError(0, 'The export timed out — is the backend running on port 8000?');
      }
      throw new ApiError(0, `Network error — could not reach the API (${(error as Error).message})`);
    } finally {
      clearTimeout(timer);
    }
  },
};

/** Extract a readable message from any thrown value. */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Something went wrong';
}
