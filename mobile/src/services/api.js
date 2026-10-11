import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Google Client ID matching backend & web frontend credentials
export const GOOGLE_CLIENT_ID = '560068179440-ojg0ad42qof5i7im6l350dk5uqrf8g65.apps.googleusercontent.com';

// Extract host IP dynamically from Expo Go Metro server connection
const getDynamicHostIp = () => {
  try {
    const hostUri = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost || '';
    if (hostUri) {
      const ip = hostUri.split(':')[0];
      if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
        return ip;
      }
    }
  } catch (e) {
    // Fallback
  }
  return '192.168.117.115';
};

const HOST_IP = getDynamicHostIp();

export const API_BASE_URL = `http://${HOST_IP}:8000/api/v1`;

// Helper for API calls with proper error message extraction
async function fetchApi(url, options = {}, timeoutMs = 5000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(options.headers || {}),
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const json = await response.json().catch(() => null);

    if (!response.ok) {
      const errMsg =
        json?.detail?.message ||
        json?.detail ||
        json?.message ||
        `Authentication failed (HTTP ${response.status})`;
      return { success: false, error: typeof errMsg === 'string' ? errMsg : 'Authentication failed.' };
    }

    return { success: true, data: json };
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      return { success: false, error: 'Connection timed out. Please check backend server.' };
    }
    return { success: false, error: 'Cannot connect to backend server. Ensure backend is running.' };
  }
}

// Generic helper with timeout & silent fallback handling (for catalog & attendance syncing)
async function fetchWithTimeout(url, options = {}, timeoutMs = 2500) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(options.headers || {}),
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }
    return await response.json().catch(() => null);
  } catch (error) {
    clearTimeout(timeoutId);
    return null;
  }
}

// -------------------------------------------------------------
// AUTHENTICATION APIs (Matching Web Frontend)
// -------------------------------------------------------------

// 1. Login User (Buyer, Employee, or Plant Head) using Email or Login ID + Password
export async function apiLoginUser(identifier, password) {
  return await fetchApi(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    body: JSON.stringify({
      identifier: identifier.trim(),
      password: password,
    }),
  });
}

// 2. Register New Buyer Account (Matching Web RegisterIn schema)
export async function apiRegisterUser({ email, password, full_name, company, phone }) {
  return await fetchApi(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
      password: password,
      full_name: full_name.trim(),
      company: company ? company.trim() : null,
      phone: phone ? phone.trim() : null,
    }),
  });
}

// 3. Buyer Google OAuth Sign-In (using GOOGLE_CLIENT_ID & id_token)
export async function apiLoginWithGoogle(googleToken) {
  return await fetchApi(`${API_BASE_URL}/auth/google`, {
    method: 'POST',
    body: JSON.stringify({
      id_token: googleToken,
    }),
  });
}

// -------------------------------------------------------------
// CATALOG & ATTENDANCE APIs
// -------------------------------------------------------------

export async function getBackendTextiles() {
  return await fetchWithTimeout(`${API_BASE_URL}/textiles`);
}

export async function createBackendRequirement(payload) {
  return await fetchWithTimeout(`${API_BASE_URL}/buyer/requirements`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function postBackendAttendancePunch(payload, token = null) {
  const headers = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return await fetchWithTimeout(`${API_BASE_URL}/attendance/punch`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
}

export async function getBackendLiveAttendanceStatus(token = null) {
  const headers = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return await fetchWithTimeout(`${API_BASE_URL}/attendance/live-status`, {
    headers,
  });
}

export async function getBackendAttendanceLogs(workerId = null, token = null) {
  const headers = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const url = workerId
    ? `${API_BASE_URL}/attendance/logs?worker_id=${encodeURIComponent(workerId)}`
    : `${API_BASE_URL}/attendance/logs`;
  return await fetchWithTimeout(url, { headers });
}
