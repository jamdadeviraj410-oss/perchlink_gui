// PerchLink Survivor SOS - Connection & Drone Hardware Status Card
import React, { useState } from 'react';
import { Wifi, Radio, Battery, Anchor, RefreshCw, ChevronDown, ChevronUp, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function ConnectionStatus({
  wifiAvailable = true,
  droneStatus = 'PERCHED',
  loraStatus = 'CONNECTED',
  batteryPercentage = 86,
  groundStationConnected = true,
  isSimulated = true,
  onRefresh,
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-3.5 transition-all">
      {/* Top summary row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {/* Main system status pill */}
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Drone Relay Active
          </span>

          {batteryPercentage !== null && (
            <span className="flex items-center gap-1 text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-full">
              <Battery className="w-3.5 h-3.5 text-emerald-600" />
              {batteryPercentage}%
            </span>
          )}
        </div>

        <div className="flex items-center space-x-1">
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              title="Refresh Telemetry"
              aria-label="Refresh status"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800 px-1.5 py-1 rounded-md"
            aria-expanded={expanded}
          >
            <span>Details</span>
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Two Essential Links Overview */}
      <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100">
        {/* Link 1: Phone to Drone Wi-Fi */}
        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Wifi className="w-3.5 h-3.5 text-blue-600" />
              Phone ↔ Drone
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          </div>
          <div className="text-xs font-semibold text-slate-800">
            Wi-Fi Connected
          </div>
          <div className="text-[10px] text-slate-500">
            SSID: PERCHLINK_SOS
          </div>
        </div>

        {/* Link 2: Drone to Ground Station LoRa */}
        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Radio className="w-3.5 h-3.5 text-red-600" />
              Drone ↔ Base
            </span>
            <span
              className={`w-2 h-2 rounded-full ${
                groundStationConnected ? 'bg-emerald-500' : 'bg-amber-500 animate-ping'
              }`}
            ></span>
          </div>
          <div className="text-xs font-semibold text-slate-800">
            {groundStationConnected ? 'LoRa Link Ready' : 'Searching Signal'}
          </div>
          <div className="text-[10px] text-slate-500">
            SX1262 868/915 MHz
          </div>
        </div>
      </div>

      {/* Expandable Technical Telemetry details */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-slate-100 text-xs space-y-2 animate-in fade-in duration-150">
          <div className="flex justify-between items-center text-slate-600">
            <span className="flex items-center gap-1.5">
              <Anchor className="w-3.5 h-3.5 text-slate-400" />
              Perching State:
            </span>
            <span className="font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
              {droneStatus}
            </span>
          </div>

          <div className="flex justify-between items-center text-slate-600">
            <span>Raspberry Pi IP:</span>
            <span className="font-mono text-slate-800 text-[11px]">192.168.4.1</span>
          </div>

          <div className="flex justify-between items-center text-slate-600">
            <span>LoRa Radio Module:</span>
            <span className="font-mono text-slate-800 text-[11px]">LILYGO T3-S3 (SX1262)</span>
          </div>

          <div className="flex justify-between items-center text-slate-600">
            <span>Data Mode:</span>
            <span className="font-semibold text-amber-600">
              {isSimulated ? 'Simulated Telemetry' : 'Live Hardware Serial'}
            </span>
          </div>

          <p className="text-[10px] text-slate-400 italic pt-1 leading-normal">
            No internet or cellular service is required. The drone acts as a self-contained radio relay node.
          </p>
        </div>
      )}
    </div>
  );
}
