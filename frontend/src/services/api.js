// PerchLink Survivor SOS - Local API Service
// Designed for local-only, offline execution on Raspberry Pi 4B

const STORAGE_KEY_SOS_LIST = 'perchlink_sos_records';
const STORAGE_KEY_ACTIVE_SOS = 'perchlink_active_sos_id';

// Check if running in mock/demo mode or connected to live FastAPI backend
const IS_PRODUCTION_BACKEND = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
const API_BASE_URL = IS_PRODUCTION_BACKEND ? '/api' : 'http://localhost:8000/api';

/**
 * Generate a sequential or unique SOS ID (e.g. SOS-7429)
 */
function generateSOSId() {
  const prefix = 'SOS';
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${num}`;
}

/**
 * Helper to get all locally stored SOS cases
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
 * Helper to save an SOS case locally
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
 * Get active SOS ID if user recently submitted one
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
 * Submit New Emergency Request
 * Phase 1: Local simulated storage with fallback to mock flow
 * Phase 2/3: Sends real POST to /api/sos
 */
export async function submitSOS(payload) {
  // If backend endpoint is available in future phases:
  try {
    const response = await fetch(`${API_BASE_URL}/sos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (response.ok) {
      const data = await response.json();
      saveSOSRecord(data);
      return data;
    }
  } catch (err) {
    // Backend not running yet (Phase 1 mode) -> fallback to simulated local store
    console.warn('API unavailable, running in Phase 1 Simulated Mode:', err.message);
  }

  // Simulated Phase 1 implementation
  const sosId = generateSOSId();
  const timestamp = new Date().toISOString();

  const mockRecord = {
    id: sosId,
    emergencyType: payload.emergencyType || 'OTHER',
    peopleCount: payload.peopleCount || 1,
    location: payload.location || null,
    landmark: payload.landmark || '',
    message: payload.message || '',
    additionalMessages: [],
    createdAt: timestamp,
    updatedAt: timestamp,
    status: 'RECEIVED_BY_DRONE', // Drone received and saved locally
    droneReceived: true,
    droneReceivedAt: timestamp,
    transmittingLoRa: false,
    groundStationAcknowledged: false,
    groundStationAcknowledgedAt: null,
    rescueTeamAcknowledged: false,
    rescueTeamAcknowledgedAt: null,
    isSimulated: true, // Transparent simulation indicator
  };

  saveSOSRecord(mockRecord);
  return mockRecord;
}

/**
 * Fetch SOS record by ID
 */
export async function getSOSById(sosId) {
  if (!sosId) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/sos/${sosId}`);
    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    // Fall back to local store
  }

  const records = getStoredSOSRecords();
  return records.find((r) => r.id === sosId) || null;
}

/**
 * Submit additional info / update to an existing SOS
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
    // Fallback in Phase 1
  }

  const record = await getSOSById(sosId);
  if (!record) return null;

  const updateEntry = {
    text: additionalMessage,
    timestamp: new Date().toISOString(),
  };

  if (!record.additionalMessages) {
    record.additionalMessages = [];
  }
  record.additionalMessages.push(updateEntry);
  saveSOSRecord(record);
  return record;
}

/**
 * Get Drone Hardware & Telemetry Status
 * GET /api/drone/status
 */
export async function fetchDroneStatus() {
  try {
    const response = await fetch(`${API_BASE_URL}/drone/status`);
    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    // Fall back to simulated telemetry
  }

  // Simulated hardware state for Phase 1
  return {
    wifiAvailable: true,
    ssid: 'PERCHLINK_SOS',
    ip: '192.168.4.1',
    droneStatus: 'PERCHED', // Options: PERCHED, HOVERING, SEARCHING
    loraStatus: 'CONNECTED', // Options: CONNECTED, TRANSMITTING, SEARCHING, DISCONNECTED
    batteryPercentage: 86,
    groundStationConnected: true,
    isSimulated: true, // Explicitly tagged as per Section 20 guidelines
    timestamp: new Date().toISOString(),
  };
}
