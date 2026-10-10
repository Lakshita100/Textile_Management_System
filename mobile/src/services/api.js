import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Extract host IP dynamically from Expo Go Metro server connection (e.g. 192.168.117.115)
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

// Dynamic API URL that works across Physical Phones on WiFi, Emulators, and Web
export const API_BASE_URL = `http://${HOST_IP}:8000/api`;

console.log(`[Mobile API Service] Configured backend API Base URL: ${API_BASE_URL}`);

// Generic helper with timeout & silent fallback handling
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
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    // Silent fallback so mobile app operates smoothly on local store if backend API is offline
    return null;
  }
}

// 1. Fetch Textile Products Catalog from Backend
export async function getBackendTextiles() {
  return await fetchWithTimeout(`${API_BASE_URL}/textiles`);
}

// 2. Post Buyer Requirement Inquiry to Backend
export async function createBackendRequirement(payload) {
  return await fetchWithTimeout(`${API_BASE_URL}/buyer/requirements`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// 3. Punch Attendance (IN / OUT) to Backend
export async function postBackendAttendancePunch(payload) {
  return await fetchWithTimeout(`${API_BASE_URL}/attendance/punch`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// 4. Fetch Employee Attendance History from Backend
export async function getBackendAttendanceLogs(workerId) {
  const url = workerId ? `${API_BASE_URL}/attendance/logs?worker_id=${workerId}` : `${API_BASE_URL}/attendance/logs`;
  return await fetchWithTimeout(url);
}
