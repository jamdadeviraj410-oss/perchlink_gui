// PerchLink Survivor Interface - Screen 2: Emergency SOS Submission Form
import React, { useState } from 'react';
import {
  ArrowLeft,
  MapPin,
  Compass,
  Users,
  AlertTriangle,
  Send,
  Loader2,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';
import EmergencyCard, { EMERGENCY_CATEGORIES } from '../components/EmergencyCard';

export default function SOSForm({
  initialCategory = 'TRAPPED',
  onSubmit,
  onCancel,
  isSubmitting = false,
}) {
  const [category, setCategory] = useState(initialCategory || 'TRAPPED');
  const [peopleCount, setPeopleCount] = useState(1);
  const [landmark, setLandmark] = useState('');
  const [message, setMessage] = useState('');

  // GPS state
  const [gpsLocation, setGpsLocation] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState(null);

  const requestGPS = () => {
    if (!navigator.geolocation) {
      setGpsError('Browser geolocation is not supported on this device.');
      return;
    }

    setGpsLoading(true);
    setGpsError(null);

    const options = {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 0,
    };

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLoading(false);
        setGpsLocation({
          latitude: Number(pos.coords.latitude.toFixed(6)),
          longitude: Number(pos.coords.longitude.toFixed(6)),
          accuracy: Math.round(pos.coords.accuracy),
          timestamp: new Date().toISOString(),
        });
      },
      (err) => {
        setGpsLoading(false);
        let errorMsg = 'Unable to acquire satellite fix.';
        if (err.code === 1) {
          errorMsg = 'Location permission was denied. Please provide a manual landmark below.';
        } else if (err.code === 2) {
          errorMsg = 'GNSS satellites unavailable (common indoors). Use manual landmark.';
        } else if (err.code === 3) {
          errorMsg = 'GPS acquisition timed out. Use manual landmark.';
        }
        setGpsError(errorMsg);
      },
      options
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    onSubmit({
      emergencyType: category,
      peopleCount: Number(peopleCount) || 1,
      location: gpsLocation
        ? {
            latitude: gpsLocation.latitude,
            longitude: gpsLocation.longitude,
            accuracy: gpsLocation.accuracy,
          }
        : null,
      landmark: landmark.trim(),
      message: message.trim(),
    });
  };

  return (
    <div className="pb-10 animate-in fade-in duration-150">
      {/* Top Navigation bar */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>
        <h2 className="text-sm font-black text-slate-800 tracking-wide uppercase">
          Emergency Distress Form
        </h2>
        <span className="w-12"></span> {/* Spacer for balance */}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Section 1: Emergency Category Selection */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
            1. Select Emergency Type *
          </label>
          <div className="grid grid-cols-1 gap-2">
            {EMERGENCY_CATEGORIES.map((cat) => (
              <EmergencyCard
                key={cat.id}
                category={cat}
                isSelected={category === cat.id}
                onSelect={(id) => setCategory(id)}
              />
            ))}
          </div>
        </div>

        {/* Section 2: Number of People */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            2. Number of People Needing Help *
          </label>
          <div className="flex items-center justify-between bg-slate-50 rounded-2xl p-3 border border-slate-200">
            <div className="flex items-center space-x-2 text-slate-700">
              <Users className="w-5 h-5 text-slate-500" />
              <span className="text-sm font-semibold">Total Survivors:</span>
            </div>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => setPeopleCount((p) => Math.max(1, p - 1))}
                className="w-10 h-10 rounded-xl bg-white border border-slate-300 font-black text-lg text-slate-700 active:bg-slate-100 flex items-center justify-center shadow-xs"
              >
                −
              </button>
              <span className="w-8 text-center font-black text-xl text-slate-900">
                {peopleCount}
              </span>
              <button
                type="button"
                onClick={() => setPeopleCount((p) => p + 1)}
                className="w-10 h-10 rounded-xl bg-white border border-slate-300 font-black text-lg text-slate-700 active:bg-slate-100 flex items-center justify-center shadow-xs"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Section 3: Location (GPS + Landmark) */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
            3. Location Details *
          </label>

          {/* GPS Button */}
          <div>
            {!gpsLocation ? (
              <button
                type="button"
                onClick={requestGPS}
                disabled={gpsLoading}
                className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 font-bold text-xs hover:bg-blue-100 active:scale-[0.99] transition-all"
              >
                {gpsLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    <span>Querying Phone GNSS Satellites...</span>
                  </>
                ) : (
                  <>
                    <Compass className="w-4 h-4 text-blue-600" />
                    <span>Share Current GPS Location</span>
                  </>
                )}
              </button>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-start justify-between">
                <div className="flex items-start space-x-2.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-emerald-900">
                      GPS Coordinates Attached
                    </div>
                    <div className="font-mono text-xs text-emerald-800 mt-0.5">
                      {gpsLocation.latitude.toFixed(6)}, {gpsLocation.longitude.toFixed(6)}
                    </div>
                    <div className="text-[10px] text-emerald-700 mt-0.5">
                      Estimated Accuracy: ±{gpsLocation.accuracy} meters
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={requestGPS}
                  className="text-[11px] font-semibold text-emerald-700 underline"
                >
                  Refresh
                </button>
              </div>
            )}

            {/* GPS Warning or Explanation */}
            {gpsError && (
              <div className="mt-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-2.5 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>{gpsError}</span>
              </div>
            )}
            <p className="text-[11px] text-slate-400 mt-1.5">
              Phone GPS works via direct satellites without mobile network, but may be blocked indoors.
            </p>
          </div>

          {/* Manual Landmark Entry */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Building, Landmark or Room (Required if GPS unavailable):
            </label>
            <input
              type="text"
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
              placeholder="e.g. Block C, 2nd floor, blue roof house near fallen pylon"
              className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-slate-50 placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Section 4: Additional Information */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            4. Additional Details (Optional)
          </label>
          <textarea
            rows="3"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="e.g. 1 elderly person unable to walk, rising flood water, urgent insulin required"
            className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-slate-50 placeholder:text-slate-400"
          ></textarea>
        </div>

        {/* Submission Button: No unnecessary delays or dialogs */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 rounded-2xl bg-linear-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-black text-base shadow-lg shadow-red-600/30 flex items-center justify-center space-x-2 active:scale-[0.99] transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Transmitting to Drone...</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>SEND EMERGENCY REQUEST</span>
              </>
            )}
          </button>
          <p className="text-[11px] text-center text-slate-500 mt-2">
            Transmits directly to Raspberry Pi 4B onboard storage over local Wi-Fi.
          </p>
        </div>
      </form>
    </div>
  );
}
