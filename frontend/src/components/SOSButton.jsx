// PerchLink Survivor SOS - Main High-Impact SOS Button Component
import React from 'react';
import { AlertOctagon, ChevronRight, ArrowRight } from 'lucide-react';

export default function SOSButton({ onClick, disabled = false }) {
  return (
    <div className="w-full text-center py-2">
      <button
        onClick={onClick}
        disabled={disabled}
        aria-label="Send Emergency SOS Request"
        className="w-full relative group overflow-hidden rounded-3xl bg-linear-to-b from-red-600 to-red-700 text-white p-6 shadow-xl shadow-red-600/30 active:scale-[0.98] transition-all duration-200 border-2 border-red-500 hover:border-red-400 focus:outline-none focus:ring-4 focus:ring-red-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {/* Subtle background pulse effect */}
        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

        <div className="flex flex-col items-center justify-center space-y-3">
          {/* Big Hexagon Warning Icon */}
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center animate-sos-pulse">
              <div className="w-16 h-16 rounded-full bg-white text-red-600 flex items-center justify-center shadow-inner">
                <AlertOctagon className="w-9 h-9 stroke-[2.5]" />
              </div>
            </div>
          </div>

          <div>
            <span className="block text-3xl font-black tracking-tight drop-shadow-xs">
              SEND SOS
            </span>
            <span className="block text-xs font-semibold text-red-100 tracking-wider uppercase mt-1">
              Tap to request immediate assistance
            </span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/20 text-red-100 text-xs font-medium">
            <span>No internet or SIM required</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </button>

      <p className="text-[11px] text-slate-500 mt-2 font-medium">
        Your distress beacon will be relayed directly to search & rescue operators via radio.
      </p>
    </div>
  );
}
