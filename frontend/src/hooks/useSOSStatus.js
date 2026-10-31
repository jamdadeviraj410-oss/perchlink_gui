// Hook for managing live SOS message delivery state & updates
import { useState, useEffect, useCallback } from 'react';
import { getSOSById, updateSOSMessage } from '../services/api';
import { socketService } from '../services/socket';

export function useSOSStatus(sosId) {
  const [sosRecord, setSosRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRecord = useCallback(async () => {
    if (!sosId) {
      setSosRecord(null);
      setLoading(false);
      return;
    }
    try {
      const record = await getSOSById(sosId);
      setSosRecord(record);
      setLoading(false);
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  }, [sosId]);

  useEffect(() => {
    fetchRecord();

    if (!sosId) return;

    // Subscribe to live status updates (WebSocket or simulated events)
    const unsubscribe = socketService.subscribe(sosId, (eventData) => {
      setSosRecord((prev) => {
        if (!prev) return prev;
        const updated = { ...prev };

        if (eventData.status) {
          updated.status = eventData.status;
        }

        if (eventData.event === 'sos_transmission_started') {
          updated.transmittingLoRa = true;
        } else if (eventData.event === 'sos_received_by_ground_station') {
          updated.transmittingLoRa = false;
          updated.groundStationAcknowledged = true;
          updated.groundStationAcknowledgedAt = eventData.timestamp;
        } else if (eventData.event === 'rescue_team_acknowledged') {
          updated.rescueTeamAcknowledged = true;
          updated.rescueTeamAcknowledgedAt = eventData.timestamp;
        } else if (eventData.event === 'sos_transmission_failed') {
          updated.transmittingLoRa = false;
          updated.status = 'PENDING_RETRY';
        }

        return updated;
      });
    });

    return () => {
      unsubscribe();
    };
  }, [sosId, fetchRecord]);

  const addNote = async (text) => {
    if (!sosId || !text.trim()) return false;
    const updated = await updateSOSMessage(sosId, text.trim());
    if (updated) {
      setSosRecord(updated);
      return true;
    }
    return false;
  };

  return {
    sosRecord,
    loading,
    error,
    refresh: fetchRecord,
    addNote,
  };
}
