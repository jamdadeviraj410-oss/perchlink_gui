// PerchLink Survivor Interface - Screen 5: Help & Offline Operational Guide
import React from 'react';
import {
  ArrowLeft,
  Wifi,
  Compass,
  Radio,
  AlertTriangle,
  HelpCircle,
  CheckCircle,
  FileText,
  LifeBuoy,
} from 'lucide-react';

export default function Help({ onNavigate }) {
  return (
    <div className="space-y-4 pb-12 animate-in fade-in duration-150">
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Home</span>
        </button>
        <h2 className="text-sm font-black text-slate-800 tracking-wide uppercase">
          Emergency Guide
        </h2>
        <span className="w-12"></span>
      </div>

      {/* Guide Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-5 shadow-sm border border-slate-800">
        <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
          <LifeBuoy className="w-4 h-4" />
          <span>Survivor Assistance Handbook</span>
        </div>
        <h3 className="text-lg font-bold">How PerchLink Emergency Relay Works</h3>
        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
          When cellular towers fail during earthquakes, floods, or structural collapses, PerchLink provides a localized radio bridge between you and emergency response dispatchers.
        </p>
      </div>

      {/* Step by step instructions */}
      <div className="space-y-3">
        {/* Step 1 */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 font-black text-sm flex items-center justify-center shrink-0 border border-blue-200">
              1
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <Wifi className="w-4 h-4 text-blue-600" />
                Connecting to the Drone Wi-Fi
              </h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Connect your smartphone Wi-Fi to <strong>PERCHLINK_SOS</strong>. No password is required. You may see a system warning stating <em>"No Internet Connection"</em> — this is normal. Keep the connection active.
              </p>
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 font-black text-sm flex items-center justify-center shrink-0 border border-red-200">
              2
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-red-600" />
                Opening the Emergency Portal
              </h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Open any web browser (Safari, Chrome, Firefox) and type <strong>http://192.168.4.1</strong> or allow the captive portal prompt to open. The entire portal is served directly from the drone's offline memory.
              </p>
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 font-black text-sm flex items-center justify-center shrink-0 border border-amber-200">
              3
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-amber-600" />
                Sharing GPS without Internet
              </h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Your smartphone has dedicated satellite GNSS chips that can calculate latitude and longitude without any mobile data. Tap <strong>Share Current GPS Location</strong>. If indoors, satellite signals may be blocked—always enter a landmark or floor number in the text box.
              </p>
            </div>
          </div>
        </div>

        {/* Step 4 */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 font-black text-sm flex items-center justify-center shrink-0 border border-emerald-200">
              4
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <Radio className="w-4 h-4 text-emerald-600" />
                Radio Transmission & Delivery Status
              </h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Once saved to the drone, the drone broadcasts your distress packet over long-range LoRa radio to base stations up to kilometers away. The status screen will truthfully tell you when the base station confirms receipt and when human dispatchers acknowledge.
              </p>
            </div>
          </div>
        </div>

        {/* Step 5 */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 font-black text-sm flex items-center justify-center shrink-0 border border-purple-200">
              5
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-purple-600" />
                What if Wi-Fi Disconnects?
              </h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                If your phone battery is low or you move out of Wi-Fi range after tapping submit, <strong>your SOS is safely stored in the drone's permanent offline database</strong> and will still be transmitted to rescue stations. When you reconnect, your tracking screen will restore automatically.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Return Button */}
      <div className="pt-2">
        <button
          onClick={() => onNavigate('home')}
          className="w-full py-3.5 rounded-2xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors shadow-sm"
        >
          Return to Emergency Home
        </button>
      </div>
    </div>
  );
}
