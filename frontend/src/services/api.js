// PerchLink Survivor SOS - Local API Service (Phase 3 Full Integration)
// Supports seamless offline operation and real FastAPI backend integration

const STORAGE_KEY_SOS_LIST = 'perchlink_sos_records';
const STORAGE_KEY_ACTIVE_SOS = 'perchlink_active_sos_id';

// Use relative API path; Vite proxy forwards to localhost:8000 in dev, FastAPI serves directly in prod
const API_BASE_URL = '/api';

/**
 * Check if the real FastAPI backend is accessible
 */
export async function checkBackendConnection() {
  try {
    const res = await fetch(`${API_BASE_URL}/health`, { signal: AbortSignal.timeout(2000) });
    if (res.ok) {
      const data = await res.json();
      return data.status === 'healthy' || data.databaseOk === true;
    }
  } catch (e) {
    // Backend unreachable
  }
  return false;
}

/**
 * Generate a fallback ID only if backend is unreachable
 */
function generateLocalSOSId() {
  const prefix = 'SOS-LOCAL';
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${num}`;
}

/**
 * Read locally cached emergency cases from browser storage
 */
export function getStoredSOSRecords() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SOS_LIST);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to read local SOS records:', e);
    return [];
  }
}

/**
 * Cache SOS case in browser storage
 */
export function saveSOSRecord(record) {
  try {
    const records = getStoredSOSRecords();
    const index = records.findIndex((r) => r.id === record.id);
    if (index >= 0) {
      records[index] = { ...records[index], ...record, updatedAt: new Date().toISOString() };
    } else {
      records.unshift(record);
    }
    localStorage.setItem(STORAGE_KEY_SOS_LIST, JSON.stringify(records));
    localStorage.setItem(STORAGE_KEY_ACTIVE_SOS, record.id);
  } catch (e) {
    console.error('Failed to persist SOS record:', e);
  }
}

/**
 * Get active SOS ID if survivor recently submitted one
 */
export function getActiveSOSId() {
  return localStorage.getItem(STORAGE_KEY_ACTIVE_SOS) || null;
}

/**
 * Clear active SOS ID (e.g. user starts completely fresh incident)
 */
export function clearActiveSOSId() {
  localStorage.removeItem(STORAGE_KEY_ACTIVE_SOS);
}

/**
 * Submit New Emergency Request (Phase 3: Real POST /api/sos)
 */
export async function submitSOS(payload) {
  const requestBody = {
    emergencyType: payload.emergencyType || 'OTHER',
    peopleCount: payload.peopleCount || 1,
    location: payload.location || null,
    landmark: payload.landmark || null,
    message: payload.message || null,
  };

  try {
    const response = await fetch(`${API_BASE_URL}/sos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (response.ok) {
      const data = await response.json();
      saveSOSRecord(data);
      console.info(`[API] Successfully created SOS case ${data.id} on backend database.`);
      return data;
    } else {
      const errData = await response.json().catch(() => ({}));
      console.warn('[API] Backend rejected SOS submission:', errData);
    }
  } catch (err) {
    console.warn('[API] Backend offline or unreachable. Falling back to local offline queue:', err.message);
  }

  // Fallback if backend is temporarily disconnected
  const localId = generateLocalSOSId();
  const timestamp = new Date().toISOString();

  const fallbackRecord = {
    id: localId,
    emergencyType: requestBody.emergencyType,
    peopleCount: requestBody.peopleCount,
    location: requestBody.location,
    landmark: requestBody.landmark || '',
    message: requestBody.message || '',
    additionalMessages: [],
    createdAt: timestamp,
    updatedAt: timestamp,
    droneReceived: false,
    droneReceivedAt: null,
    status: 'SUBMITTING',
    transmittingLoRa: false,
    groundStationAcknowledged: false,
    groundStationAcknowledgedAt: null,
    rescueTeamAcknowledged: false,
    rescueTeamAcknowledgedAt: null,
    isSimulated: true,
  };

  saveSOSRecord(fallbackRecord);
  return fallbackRecord;
}

/**
 * Fetch SOS record by ID (Phase 3: Real GET /api/sos/{id})
 */
export async function getSOSById(sosId) {
  if (!sosId) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/sos/${sosId}`, {
      signal: AbortSignal.timeout(3000),
    });
    if (response.ok) {
      const liveData = await response.json();
      saveSOSRecord(liveData);
      return liveData;
    }
  } catch (err) {
    // Network error -> read from local cache
  }

  const records = getStoredSOSRecords();
  return records.find((r) => r.id === sosId) || null;
}

/**
 * Submit additional info to an existing SOS (Phase 3: Real POST /api/sos/{id}/update)
 */
export async function updateSOSMessage(sosId, additionalMessage) {
  try {
    const response = await fetch(`${API_BASE_URL}/sos/${sosId}/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: additionalMessage }),
    });

    if (response.ok) {
      const updated = await response.json();
      saveSOSRecord(updated);
      return updated;
    }
  } catch (err) {
    console.warn('[API] Could not send note to backend:', err.message);
  }

  // Fallback cache update
  const record = await getSOSById(sosId);
  if (!record) return null;

  if (!record.additionalMessages) {
    record.additionalMessages = [];
  }
  record.additionalMessages.push({
    text: additionalMessage,
    timestamp: new Date().toISOString(),
  });
  saveSOSRecord(record);
  return record;
}

/**
 * Get Drone Hardware & Telemetry Status (Phase 3: Real GET /api/drone/status)
 */
export async function fetchDroneStatus() {
  try {
    const response = await fetch(`${API_BASE_URL}/drone/status`, {
      signal: AbortSignal.timeout(3000),
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    // Fall back to offline defaults
  }

  return {
    wifiAvailable: true,
    ssid: 'PERCHLINK_SOS',
    ip: '192.168.4.1',
    droneStatus: 'PERCHED',
    loraStatus: 'CONNECTED',
    batteryPercentage: null,
    groundStationConnected: true,
    isSimulated: true,
    timestamp: new Date().toISOString(),
  };
}
