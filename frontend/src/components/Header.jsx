// PerchLink Survivor SOS Header Component
import React, { useState } from 'react';
import { Radio, HelpCircle, ShieldAlert, Globe, Wifi, Check, AlertTriangle } from 'lucide-react';

export default function Header({ currentScreen, onNavigate, isSimulated = true }) {
  const [showLangModal, setShowLangModal] = useState(false);
  const [selectedLang, setSelectedLang] = useState('en');

  const languages = [
    { code: 'en', label: 'English (US)' },
    { code: 'hi', label: 'हिंदी (Hindi)' },
    { code: 'es', label: 'Español (Spanish)' },
    { code: 'fr', label: 'Français (French)' },
    { code: 'ar', label: 'العربية (Arabic)' },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-900 text-white shadow-md border-b border-slate-800">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo & Brand */}
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center space-x-2.5 text-left focus:outline-none group"
            aria-label="PerchLink Home"
          >
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-red-600 shadow-lg shadow-red-600/30 group-active:scale-95 transition-transform">
              <Radio className="w-5 h-5 text-white animate-pulse" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-black text-lg tracking-wider text-white">PERCHLINK</span>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                  SOS
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium leading-none mt-0.5 flex items-center gap-1">
                <Wifi className="w-3 h-3 text-emerald-400" />
                <span>PERCHLINK_SOS Wi-Fi</span>
              </p>
            </div>
          </button>

          {/* Action Buttons: Language & Help */}
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setShowLangModal(true)}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1 text-xs font-medium"
              title="Change Language"
              aria-label="Language selection"
            >
              <Globe className="w-4 h-4" />
              <span className="uppercase text-[11px] font-bold">{selectedLang}</span>
            </button>

            <button
              onClick={() => onNavigate('help')}
              className={`p-2 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold ${
                currentScreen === 'help'
                  ? 'bg-red-600 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
              }`}
              title="Emergency Help & Offline Guide"
              aria-label="Help Instructions"
            >
              <HelpCircle className="w-4 h-4 text-amber-400" />
              <span className="text-xs">Help</span>
            </button>
          </div>
        </div>

        {/* Simulation Banner - Transparent & Truthful as required by Section 20 */}
        {isSimulated && (
          <div className="bg-amber-500/10 border-t border-amber-500/20 px-3 py-1.5 text-center">
            <div className="max-w-md mx-auto flex items-center justify-center gap-1.5 text-[11px] text-amber-300 font-medium">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>
                <strong>Simulation Mode:</strong> No live radio attached. Hardware events are simulated locally.
              </span>
            </div>
          </div>
        )}
      </header>

      {/* Language Modal Placeholder */}
      {showLangModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xs w-full p-5 shadow-2xl text-slate-900 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Globe className="w-4 h-4 text-slate-700" />
                Select Language
              </h3>
              <button
                onClick={() => setShowLangModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-semibold p-1"
              >
                ✕
              </button>
            </div>
            <div className="space-y-1.5">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setSelectedLang(lang.code);
                    setShowLangModal(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    selectedLang === lang.code
                      ? 'bg-red-50 text-red-700 border border-red-200 font-semibold'
                      : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <span>{lang.label}</span>
                  {selectedLang === lang.code && <Check className="w-4 h-4 text-red-600" />}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 mt-3 text-center">
              Offline multilingual translations are bundled locally.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
