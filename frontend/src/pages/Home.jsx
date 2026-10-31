// PerchLink Survivor Interface - Screen 1: Emergency Home
import React from 'react';
import {
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Radio,
  Wifi,
  Users,
  Compass,
  FileText,
  LifeBuoy,
} from 'lucide-react';
import ConnectionStatus from '../components/ConnectionStatus';
import SOSButton from '../components/SOSButton';
import EmergencyCard, { EMERGENCY_CATEGORIES } from '../components/EmergencyCard';

export default function Home({
  droneStatus,
  activeSosId,
  onNavigate,
  onSelectCategoryAndOpenForm,
}) {
  return (
    <div className="space-y-4 pb-8 animate-in fade-in duration-200">
      {/* Active Emergency Banner if user already has a pending/active SOS */}
      {activeSosId && (
        <div className="bg-red-50 border-2 border-red-500 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-red-700 font-bold text-xs uppercase tracking-wide">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
              Active Emergency Case
            </div>
            <div className="font-extrabold text-slate-900 text-base mt-0.5">
              Case ID: {activeSosId}
            </div>
            <div className="text-xs text-slate-600 mt-0.5">
              Distress signal is currently active on the relay
            </div>
          </div>
          <button
            onClick={() => onNavigate('status', { sosId: activeSosId })}
            className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shrink-0 shadow-sm flex items-center gap-1"
          >
            <span>Track</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Network and Drone Telemetry Card */}
      <ConnectionStatus
        wifiAvailable={droneStatus.wifiAvailable}
        droneStatus={droneStatus.droneStatus}
        loraStatus={droneStatus.loraStatus}
        batteryPercentage={droneStatus.batteryPercentage}
        groundStationConnected={droneStatus.groundStationConnected}
        isSimulated={droneStatus.isSimulated}
        onRefresh={droneStatus.refresh}
      />

      {/* Primary Local Emergency Info Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center space-x-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Off-Grid Emergency Drone Relay</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            You are connected to PerchLink
          </h2>
          <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
            Conventional phone towers may be down. This autonomous drone relays your emergency distress coordinates directly to search and rescue stations over long-range radio.
          </p>
        </div>
        <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-red-600/10 rounded-full blur-xl pointer-events-none"></div>
      </div>

      {/* MAIN CALL TO ACTION: Massive SOS Button */}
      <SOSButton onClick={() => onNavigate('form')} />

      {/* Quick Emergency Category Shortcuts */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Or Tap Your Specific Emergency
          </h3>
          <span className="text-[11px] text-slate-400 font-medium">Quick Select</span>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {EMERGENCY_CATEGORIES.slice(0, 4).map((cat) => (
            <EmergencyCard
              key={cat.id}
              category={cat}
              compact={true}
              isSelected={false}
              onSelect={(catId) => onSelectCategoryAndOpenForm(catId)}
            />
          ))}
        </div>

        <div className="grid grid-cols-4 gap-2 mt-2">
          {EMERGENCY_CATEGORIES.slice(4, 8).map((cat) => (
            <EmergencyCard
              key={cat.id}
              category={cat}
              compact={true}
              isSelected={false}
              onSelect={(catId) => onSelectCategoryAndOpenForm(catId)}
            />
          ))}
        </div>
      </div>

      {/* Offline Survivor Instructions Card */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
            <LifeBuoy className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 leading-tight">
              Need Instructions?
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Learn how offline GPS and radio relays work.
            </p>
          </div>
        </div>
        <button
          onClick={() => onNavigate('help')}
          className="text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl transition-colors"
        >
          View Guide
        </button>
      </div>
    </div>
  );
}
