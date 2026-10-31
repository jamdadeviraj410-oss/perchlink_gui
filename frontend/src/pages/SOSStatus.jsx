// PerchLink Survivor Interface - Screen 3: SOS Submission Status
import React from 'react';
import {
  ShieldAlert,
  ArrowRight,
  FileText,
  Radio,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  PlusCircle,
  LifeBuoy,
} from 'lucide-react';
import DeliveryTimeline from '../components/DeliveryTimeline';

export default function SOSStatus({
  sosRecord,
  loading = false,
  onNavigate,
  onRetry,
}) {
  if (loading || !sosRecord) {
    return (
      <div className="py-12 text-center text-slate-500 space-y-3">
        <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-sm font-semibold">Retrieving distress record from drone...</p>
      </div>
    );
  }

  const copySosId = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(sosRecord.id);
      alert(`Copied Emergency ID: ${sosRecord.id}`);
    }
  };

  return (
    <div className="space-y-4 pb-10 animate-in fade-in duration-150">
      {/* Top Header Card */}
      <div className="bg-slate-900 text-white rounded-3xl p-5 shadow-sm border border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-ping"></span>
            <span className="text-xs font-bold text-red-400 uppercase tracking-wider">
              Distress Case Active
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            {new Date(sosRecord.createdAt).toLocaleTimeString()}
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block font-medium">Unique Emergency ID:</span>
            <div className="text-2xl font-black tracking-wider text-white font-mono flex items-center gap-2">
              <span>{sosRecord.id}</span>
              <button
                onClick={copySosId}
                className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-md transition-colors"
                title="Copy ID"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] text-slate-400 block font-medium">Category:</span>
            <span className="inline-block px-2.5 py-1 rounded-lg bg-red-500/20 text-red-300 font-bold text-xs uppercase border border-red-500/30">
              {sosRecord.emergencyType}
            </span>
          </div>
        </div>
      </div>

      {/* Honest Delivery Timeline */}
      <DeliveryTimeline
        status={sosRecord.status}
        transmittingLoRa={sosRecord.transmittingLoRa}
        groundStationAcknowledged={sosRecord.groundStationAcknowledged}
        rescueTeamAcknowledged={sosRecord.rescueTeamAcknowledged}
        timestamps={{
          createdAt: sosRecord.createdAt ? new Date(sosRecord.createdAt).toLocaleTimeString() : null,
          droneReceivedAt: sosRecord.droneReceivedAt ? new Date(sosRecord.droneReceivedAt).toLocaleTimeString() : null,
          groundStationAcknowledgedAt: sosRecord.groundStationAcknowledgedAt ? new Date(sosRecord.groundStationAcknowledgedAt).toLocaleTimeString() : null,
          rescueTeamAcknowledgedAt: sosRecord.rescueTeamAcknowledgedAt ? new Date(sosRecord.rescueTeamAcknowledgedAt).toLocaleTimeString() : null,
        }}
        isSimulated={sosRecord.isSimulated}
        onRetry={onRetry}
      />

      {/* Quick Summary Card & View Full Details Button */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Reported Info Summary
          </span>
          <span className="text-xs text-slate-700 font-semibold">
            {sosRecord.peopleCount} {sosRecord.peopleCount === 1 ? 'person' : 'people'}
          </span>
        </div>

        <div className="text-xs text-slate-700 space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
          {sosRecord.location && (
            <div>
              <span className="font-semibold text-slate-500">GPS: </span>
              <span className="font-mono text-slate-900">
                {sosRecord.location.latitude}, {sosRecord.location.longitude}
              </span>
            </div>
          )}
          {sosRecord.landmark && (
            <div>
              <span className="font-semibold text-slate-500">Landmark: </span>
              <span className="text-slate-900">{sosRecord.landmark}</span>
            </div>
          )}
          {sosRecord.message && (
            <div>
              <span className="font-semibold text-slate-500">Message: </span>
              <span className="text-slate-900 italic">"{sosRecord.message}"</span>
            </div>
          )}
        </div>

        {/* Action Buttons: View Full Details / Add Additional Info */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={() => onNavigate('details', { sosId: sosRecord.id })}
            className="w-full flex items-center justify-center gap-1.5 py-3 px-3 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors"
          >
            <FileText className="w-4 h-4 text-slate-300" />
            <span>Full Details</span>
          </button>

          <button
            onClick={() => onNavigate('details', { sosId: sosRecord.id, focusAdd: true })}
            className="w-full flex items-center justify-center gap-1.5 py-3 px-3 rounded-xl bg-red-50 text-red-700 border border-red-200 font-bold text-xs hover:bg-red-100 transition-colors"
          >
            <PlusCircle className="w-4 h-4 text-red-600" />
            <span>Add Details</span>
          </button>
        </div>
      </div>

      {/* Safety Notice */}
      <div className="p-3 bg-slate-200/60 rounded-xl text-center text-[11px] text-slate-600 leading-normal">
        Keep your phone connected to the <strong>PERCHLINK_SOS</strong> Wi-Fi network to continue receiving live delivery acknowledgements.
      </div>
    </div>
  );
}
