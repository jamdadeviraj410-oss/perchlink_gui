// PerchLink Survivor SOS - Real-Time WebSocket Service (Phase 3 Integration)
// Connects to live FastAPI /ws/sos/{id} endpoint with automatic recovery and fallback

import { getSOSById, saveSOSRecord } from './api';

class SOSSocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.activeSosId = null;
    this.reconnectTimeout = null;
    this.pingInterval = null;
    this.isConnected = false;
    this.isLive = false;
  }

  /**
   * Subscribe to status events for an SOS ID
   */
  subscribe(sosId, callback) {
    if (!this.listeners.has(sosId)) {
      this.listeners.set(sosId, new Set());
    }
    this.listeners.get(sosId).add(callback);

    this.connect(sosId);

    return () => {
      const callbacks = this.listeners.get(sosId);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.listeners.delete(sosId);
          this.disconnect();
        }
      }
    };
  }

  /**
   * Connect to real FastAPI WebSocket endpoint: /ws/sos/{sosId}
   */
  connect(sosId) {
    this.activeSosId = sosId;
    this.clearPing();

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // In dev: proxy on port 5173 forwards /ws to localhost:8000
    // In prod: direct connection to Raspberry Pi port 80/8000
    const wsUrl = `${protocol}//${window.location.host}/ws/sos/${sosId}`;

    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        this.isConnected = true;
        this.isLive = true;
        console.info(`[WS] Connected to live backend WebSocket for case ${sosId}`);

        // Start ping heartbeat every 10 seconds
        this.pingInterval = setInterval(() => {
          if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send('ping');
          }
        }, 10000);

        this.emitStatus(sosId, { event: 'connected', isLiveWs: true });
      };

      this.socket.onmessage = async (event) => {
        if (event.data === 'pong') return;

        try {
          const data = JSON.parse(event.data);
          console.info(`[WS] Live event received for ${sosId}:`, data.event);

          // Update local cache with live progress
          const current = await getSOSById(sosId);
          if (current) {
            if (data.status) current.status = data.status;
            if (data.event === 'sos_transmission_started') {
              current.transmittingLoRa = true;
            } else if (data.event === 'sos_received_by_ground_station') {
              current.transmittingLoRa = false;
              current.groundStationAcknowledged = true;
              current.groundStationAcknowledgedAt = data.timestamp;
            } else if (data.event === 'rescue_team_acknowledged') {
              current.rescueTeamAcknowledged = true;
              current.rescueTeamAcknowledgedAt = data.timestamp;
            }
            saveSOSRecord(current);
          }

          this.emitStatus(sosId, data);
        } catch (e) {
          console.error('[WS] Error parsing message payload:', e);
        }
      };

      this.socket.onerror = (e) => {
        console.warn(`[WS] Connection issue on ${wsUrl}`);
      };

      this.socket.onclose = async () => {
        this.isConnected = false;
        this.isLive = false;
        this.clearPing();
        console.info(`[WS] Disconnected from ${sosId}. Recovering status via REST API...`);

        // Requirement (plan.md:L491): Fetch current SOS status through REST API if WS disconnects
        try {
          const fresh = await getSOSById(sosId);
          if (fresh) {
            this.emitStatus(sosId, { event: 'recovered_from_rest', ...fresh });
          }
        } catch (err) {}

        // Schedule automatic reconnect attempt
        if (this.listeners.has(sosId)) {
          this.reconnectTimeout = setTimeout(() => {
            if (this.listeners.has(sosId)) {
              this.connect(sosId);
            }
          }, 3000);
        }
      };
    } catch (e) {
      console.warn('[WS] Could not initialize WebSocket, will retry:', e.message);
    }
  }

  emitStatus(sosId, payload) {
    const callbacks = this.listeners.get(sosId);
    if (callbacks) {
      callbacks.forEach((cb) => {
        try {
          cb(payload);
        } catch (e) {
          console.error('Error invoking status listener:', e);
        }
      });
    }
  }

  clearPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  disconnect() {
    this.clearPing();
    if (this.socket) {
      try {
        this.socket.close();
      } catch (e) {}
      this.socket = null;
    }
    this.isConnected = false;
    this.isLive = false;
  }
}

export const socketService = new SOSSocketService();
