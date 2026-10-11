/**
 * Real authentication service — talks to the FastAPI backend auth module
 * (POST /api/v1/auth/register, POST /api/v1/auth/login, GET /api/v1/auth/me,
 * POST /api/v1/auth/logout) with Bearer JWT sessions.
 */
import { http, ApiError } from './http';

export type AuthRole = 'admin' | 'buyer' | 'staff';

export interface AuthUser {
  id: number;
  email: string | null;
  login_id: string | null;
  full_name: string;
  role: AuthRole;
  company: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  postal_code: string | null;
  is_active: boolean;
  permissions: string[];
  must_change_password: boolean;
  created_at: string;
}

export function homePathForUser(user: Pick<AuthUser, 'role' | 'permissions' | 'must_change_password'>): string {
  if (user.must_change_password) return '/change-password';
  if (user.role === 'admin') return '/admin';
  if (user.role === 'buyer') return '/buyer';
  const destinations: Record<string, string> = {
    materials: '/inventory',
    machines: '/machines',
    production: '/dashboard',
    recommendations: '/recommend',
    quality: '/quality',
    dispatch: '/quality/dispatch',
    attendance: '/attendance',
  };
  return user.permissions.map((permission) => destinations[permission]).find(Boolean) ?? '/dashboard';
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
  company?: string;
  phone?: string;
}

export interface EmployeeCreateInput {
  full_name: string;
  email?: string;
  phone?: string;
  permissions: string[];
}

export interface ProvisionedEmployee {
  user: AuthUser;
  temporary_password: string;
}

export interface EmployeeUpdateInput {
  permissions?: string[];
  is_active?: boolean;
}

export interface BuyerProfileUpdateInput {
  full_name: string;
  company: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  postal_code: string;
}

export interface BuyerYarnCatalogItem {
  yarnId: string;
  yarnName: string;
  productCode: string;
  category: string;
  materialComposition: string;
  denierSpecification: string;
  colourShade: string;
  unit: string;
}

export interface BuyerFabricCatalogItem {
  recipeCode: string;
  fabricName: string;
  fabricCategory: string;
  construction: string;
  finishedWeightKg: number;
  expectedWastePercent: number;
  ingredients: Array<{
    lineNo: number;
    yarnId: string | null;
    yarnRole: string;
    yarnType: string;
    specification: string;
    quantityKg: number;
    wastePercent: number;
  }>;
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

export async function signIn(identifier: string, password: string): Promise<AuthSession> {
  return http.post<AuthSession>('/auth/login', { identifier, password });
}

export async function signInWithGoogle(idToken: string): Promise<AuthSession> {
  return http.post<AuthSession>('/auth/google', { id_token: idToken });
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<AuthUser> {
  return http.post<AuthUser>('/auth/change-password', {
    current_password: currentPassword,
    new_password: newPassword,
  }, { headers: authHeaders() });
}

export async function listEmployeeAccounts(): Promise<AuthUser[]> {
  return http.get<AuthUser[]>('/auth/admin/accounts', { headers: authHeaders() });
}

export async function createEmployee(input: EmployeeCreateInput): Promise<ProvisionedEmployee> {
  return http.post<ProvisionedEmployee>('/auth/admin/employees', input, { headers: authHeaders() });
}

export async function updateEmployee(id: number, input: EmployeeUpdateInput): Promise<AuthUser> {
  return http.patch<AuthUser>(`/auth/admin/accounts/${id}`, input, { headers: authHeaders() });
}

export async function resetEmployeePassword(id: number): Promise<ProvisionedEmployee> {
  return http.post<ProvisionedEmployee>(`/auth/admin/accounts/${id}/reset-password`, undefined, { headers: authHeaders() });
}

export async function fetchCurrentUser(): Promise<AuthUser> {
  return http.get<AuthUser>('/auth/me', { headers: authHeaders() });
}

export async function updateBuyerProfile(input: BuyerProfileUpdateInput): Promise<AuthUser> {
  return http.patch<AuthUser>('/auth/profile', input, { headers: authHeaders() });
}

export async function getBuyerYarnCatalog(): Promise<BuyerYarnCatalogItem[]> {
  return http.get<BuyerYarnCatalogItem[]>('/auth/catalog/yarn', { headers: authHeaders() });
}

export async function getBuyerFabricCatalog(): Promise<BuyerFabricCatalogItem[]> {
  return http.get<BuyerFabricCatalogItem[]>('/auth/catalog/fabric', { headers: authHeaders() });
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
