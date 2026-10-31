// Hook for monitoring drone health, battery, perching state, and LoRa link
import { useState, useEffect, useCallback } from 'react';
import { fetchDroneStatus } from '../services/api';

export function useDroneStatus(pollIntervalMs = 8000) {
  const [status, setStatus] = useState({
    wifiAvailable: true,
    ssid: 'PERCHLINK_SOS',
    ip: '192.168.4.1',
    droneStatus: 'PERCHED', // PERCHED | HOVERING | SEARCHING
    loraStatus: 'CONNECTED', // CONNECTED | TRANSMITTING | SEARCHING | DISCONNECTED
    batteryPercentage: 86,
    groundStationConnected: true,
    isSimulated: true,
    lastUpdated: null,
    loading: true,
  });

  const refresh = useCallback(async () => {
    try {
      const data = await fetchDroneStatus();
      if (data) {
        setStatus((prev) => ({
          ...prev,
          ...data,
          lastUpdated: new Date(),
          loading: false,
        }));
      }
    } catch (err) {
      console.warn('Failed to refresh drone status:', err);
      setStatus((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, pollIntervalMs);
    return () => clearInterval(interval);
  }, [refresh, pollIntervalMs]);

  return { ...status, refresh };
}
