// PerchLink Survivor SOS - Real-time WebSocket & Status Simulator
// Provides real WebSocket connectivity with automatic fallback to Phase 1 Simulation

import { getSOSById, saveSOSRecord } from './api';

class SOSSocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.activeSosId = null;
    this.simulationTimers = [];
    this.reconnectTimeout = null;
    this.isConnected = false;
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
   * Connect WebSocket or initiate Phase 1 simulation
   */
  connect(sosId) {
    this.activeSosId = sosId;
    this.clearTimers();

    const host = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
      ? 'localhost:8000' 
      : window.location.host;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${host}/ws/sos/${sosId}`;

    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        this.isConnected = true;
        this.emitStatus(sosId, { event: 'connected', isLiveWs: true });
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.emitStatus(sosId, data);
        } catch (e) {
          console.error('Error parsing WebSocket message:', e);
        }
      };

      this.socket.onerror = () => {
        // Fall back to simulation in Phase 1
        this.fallbackToSimulation(sosId);
      };

      this.socket.onclose = () => {
        this.isConnected = false;
        // Schedule reconnect attempt
        this.reconnectTimeout = setTimeout(() => {
          if (this.listeners.has(sosId)) {
            this.connect(sosId);
          }
        }, 5000);
      };
    } catch (e) {
      this.fallbackToSimulation(sosId);
    }
  }

  /**
   * Fallback simulator for Phase 1 testing
   */
  async fallbackToSimulation(sosId) {
    this.clearTimers();
    const current = await getSOSById(sosId);
    if (!current) return;

    // Stage 1: Received by Drone (Already true on submit)
    this.emitStatus(sosId, {
      event: 'sos_received_by_drone',
      sosId,
      status: 'RECEIVED_BY_DRONE',
      timestamp: current.droneReceivedAt || new Date().toISOString(),
      isSimulated: true,
      message: 'Emergency request stored securely on drone storage',
    });

    // If already fully acknowledged, don't re-run timeline
    if (current.rescueTeamAcknowledged) {
      this.emitStatus(sosId, {
        event: 'rescue_team_acknowledged',
        sosId,
        status: 'RESCUE_TEAM_ACKNOWLEDGED',
        timestamp: current.rescueTeamAcknowledgedAt,
        isSimulated: true,
      });
      return;
    }

    // Stage 2: LoRa radio transmission starting (after 3 seconds)
    const t1 = setTimeout(() => {
      const updated = {
        ...current,
        status: 'TRANSMITTING_TO_RESCUE_STATION',
        transmittingLoRa: true,
      };
      saveSOSRecord(updated);
      this.emitStatus(sosId, {
        event: 'sos_transmission_started',
        sosId,
        status: 'TRANSMITTING_TO_RESCUE_STATION',
        timestamp: new Date().toISOString(),
        isSimulated: true,
        message: 'Broadcasting packet via SX1262 LoRa radio to ground station...',
      });
    }, 3000);
    this.simulationTimers.push(t1);

    // Stage 3: Ground station LoRa ACK received (after 8 seconds)
    const t2 = setTimeout(async () => {
      const fresh = await getSOSById(sosId);
      const ackTime = new Date().toISOString();
      const updated = {
        ...fresh,
        status: 'RECEIVED_BY_GROUND_STATION',
        transmittingLoRa: false,
        groundStationAcknowledged: true,
        groundStationAcknowledgedAt: ackTime,
      };
      saveSOSRecord(updated);
      this.emitStatus(sosId, {
        event: 'sos_received_by_ground_station',
        sosId,
        status: 'RECEIVED_BY_GROUND_STATION',
        timestamp: ackTime,
        isSimulated: true,
        message: 'Ground station confirmed LoRa packet receipt',
      });
    }, 8000);
    this.simulationTimers.push(t2);

    // Stage 4: Rescue Team Human Operator Confirmation (after 14 seconds)
    const t3 = setTimeout(async () => {
      const fresh = await getSOSById(sosId);
      const operatorTime = new Date().toISOString();
      const updated = {
        ...fresh,
        status: 'RESCUE_TEAM_ACKNOWLEDGED',
        rescueTeamAcknowledged: true,
        rescueTeamAcknowledgedAt: operatorTime,
      };
      saveSOSRecord(updated);
      this.emitStatus(sosId, {
        event: 'rescue_team_acknowledged',
        sosId,
        status: 'RESCUE_TEAM_ACKNOWLEDGED',
        timestamp: operatorTime,
        isSimulated: true,
        message: 'Rescue coordinator verified emergency details',
      });
    }, 14000);
    this.simulationTimers.push(t3);
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

  clearTimers() {
    this.simulationTimers.forEach((t) => clearTimeout(t));
    this.simulationTimers = [];
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  disconnect() {
    this.clearTimers();
    if (this.socket) {
      try {
        this.socket.close();
      } catch (e) {}
      this.socket = null;
    }
    this.isConnected = false;
  }
}

export const socketService = new SOSSocketService();
