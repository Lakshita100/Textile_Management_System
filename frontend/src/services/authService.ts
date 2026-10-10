/**
 * Real authentication service — talks to the FastAPI backend auth module
 * (POST /api/v1/auth/register, POST /api/v1/auth/login, GET /api/v1/auth/me,
 * POST /api/v1/auth/logout) with Bearer JWT sessions.
 */
import { http, ApiError } from './http';

export type AuthRole = 'admin' | 'buyer' | 'staff';

export interface AuthUser {
  id: number;
  email: string;
  full_name: string;
  role: AuthRole;
  company: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
}

export interface AuthSession {
  token: string;
  token_type: string;
  user: AuthUser;
}

export interface RegisterInput {
  email: string;
  password: string;
  full_name: string;
  role?: 'buyer' | 'staff';
  company?: string;
  phone?: string;
}

const TOKEN_KEY = 'everest-auth-token';

export function getStoredToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function storeToken(token: string | null): void {
  try {
    if (token) {
      window.localStorage.setItem(TOKEN_KEY, token);
    } else {
      window.localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    /* storage unavailable (private mode) — session stays in memory only */
  }
}

/** Attach the Bearer token to a request when present. */
export function authHeaders(): Record<string, string> {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function registerAccount(input: RegisterInput): Promise<AuthSession> {
  return http.post<AuthSession>('/auth/register', input);
}

export async function signIn(email: string, password: string): Promise<AuthSession> {
  return http.post<AuthSession>('/auth/login', { email, password });
}

export async function fetchCurrentUser(): Promise<AuthUser> {
  return http.get<AuthUser>('/auth/me', { headers: authHeaders() });
}

export async function signOut(): Promise<void> {
  try {
    await http.post('/auth/logout', undefined, { headers: authHeaders() });
  } catch {
    /* stateless logout — client discards the token regardless */
  } finally {
    storeToken(null);
  }
}

export { ApiError };
