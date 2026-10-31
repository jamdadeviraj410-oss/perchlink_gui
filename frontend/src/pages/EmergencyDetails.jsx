// PerchLink Survivor Interface - Screen 4: Emergency Details & Updates
import React, { useState } from 'react';
import {
  ArrowLeft,
  Copy,
  Clock,
  MapPin,
  Users,
  Send,
  PlusCircle,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';

export default function EmergencyDetails({
  sosRecord,
  onNavigate,
  onAddNote,
  focusAdd = false,
  onStartNewSOS,
}) {
  const [newNote, setNewNote] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);
  const [noteSuccess, setNoteSuccess] = useState(false);

  if (!sosRecord) {
    return (
      <div className="py-12 text-center text-slate-500">
        <p className="text-sm">No emergency record found.</p>
        <button
          onClick={() => onNavigate('home')}
          className="mt-3 text-xs font-bold text-red-600 underline"
        >
          Return Home
        </button>
      </div>
    );
  }

  const handleSendNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim() || submittingNote) return;

    setSubmittingNote(true);
    setNoteSuccess(false);

    const ok = await onAddNote(newNote.trim());
    setSubmittingNote(false);

    if (ok) {
      setNewNote('');
      setNoteSuccess(true);
      setTimeout(() => setNoteSuccess(false), 3000);
    }
  };

  const copySosId = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(sosRecord.id);
      alert(`Copied Emergency ID: ${sosRecord.id}`);
    }
  };

  return (
    <div className="space-y-4 pb-12 animate-in fade-in duration-150">
      {/* Top Navigation */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <button
          onClick={() => onNavigate('status', { sosId: sosRecord.id })}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Timeline</span>
        </button>
        <h2 className="text-sm font-black text-slate-800 tracking-wide uppercase">
          Incident File
        </h2>
        <span className="w-12"></span>
      </div>

      {/* Case Overview Badge */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Emergency Case Number
            </span>
            <div className="text-2xl font-black text-slate-900 font-mono flex items-center gap-2 mt-0.5">
              <span>{sosRecord.id}</span>
              <button
                onClick={copySosId}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
                title="Copy ID"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>

          <span className="px-3 py-1.5 rounded-xl bg-red-50 text-red-700 font-black text-xs uppercase border border-red-200">
            {sosRecord.emergencyType}
          </span>
        </div>

        {/* Status Pill */}
        <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs">
          <span className="text-slate-500 font-medium">Relay Status:</span>
          <span className="font-bold text-slate-900 flex items-center gap-1.5">
            {sosRecord.rescueTeamAcknowledged ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700">Rescue Team Confirmed</span>
              </>
            ) : sosRecord.groundStationAcknowledged ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span className="text-blue-700">Ground Base Received</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                <span className="text-amber-700">Stored on Drone / LoRa Queued</span>
              </>
            )}
          </span>
        </div>

        {/* Detailed Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs pt-1">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-slate-400 font-medium block text-[11px]">Survivors</span>
            <span className="font-bold text-slate-800 text-sm mt-0.5 block flex items-center gap-1">
              <Users className="w-4 h-4 text-slate-500" />
              {sosRecord.peopleCount} {sosRecord.peopleCount === 1 ? 'Person' : 'People'}
            </span>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-slate-400 font-medium block text-[11px]">Submitted At</span>
            <span className="font-mono text-slate-800 text-xs mt-1 block flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {new Date(sosRecord.createdAt).toLocaleTimeString()}
            </span>
          </div>
        </div>

        {/* Location Block */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-1.5">
          <span className="text-slate-400 font-medium block text-[11px] flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-500" />
            Reported Location
          </span>

          {sosRecord.location ? (
            <div className="font-mono text-slate-800">
              <strong>GPS:</strong> {sosRecord.location.latitude.toFixed(6)},{' '}
              {sosRecord.location.longitude.toFixed(6)}
              {sosRecord.location.accuracy && (
                <span className="text-slate-500 text-[11px] ml-1">
                  (±{sosRecord.location.accuracy}m)
                </span>
              )}
            </div>
          ) : (
            <div className="text-slate-500 italic">No direct GPS coordinates supplied.</div>
          )}

          {sosRecord.landmark && (
            <div className="text-slate-800 pt-0.5">
              <strong>Landmark:</strong> {sosRecord.landmark}
            </div>
          )}
        </div>

        {/* Primary Message */}
        {sosRecord.message && (
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
            <span className="text-slate-400 font-medium block text-[11px] mb-1">
              Initial Message
            </span>
            <p className="text-slate-800 italic leading-relaxed">
              "{sosRecord.message}"
            </p>
          </div>
        )}
      </div>

      {/* Supplemental Updates Thread */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4 text-slate-600" />
            Supplemental Updates
          </h3>
          <span className="text-xs text-slate-400">
            {sosRecord.additionalMessages?.length || 0} attached
          </span>
        </div>

        {/* Existing notes */}
        {sosRecord.additionalMessages && sosRecord.additionalMessages.length > 0 ? (
          <div className="space-y-2">
            {sosRecord.additionalMessages.map((msg, i) => (
              <div
                key={i}
                className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs"
              >
                <p className="text-slate-800">{msg.text}</p>
                <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">
            No supplemental notes attached yet.
          </p>
        )}

        {/* Add Supplemental Note Form */}
        <form onSubmit={handleSendNote} className="pt-2 border-t border-slate-100">
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Add More Details to this Case:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="e.g. Water rising faster, moved to roof"
              className="flex-1 text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 bg-slate-50"
            />
            <button
              type="submit"
              disabled={submittingNote || !newNote.trim()}
              className="px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 disabled:opacity-50"
            >
              {submittingNote ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>Send</span>
            </button>
          </div>
          {noteSuccess && (
            <p className="text-[11px] text-emerald-600 font-semibold mt-1.5">
              ✓ Supplemental note forwarded to transmission queue.
            </p>
          )}
        </form>
      </div>

      {/* Separate Incident / New SOS trigger */}
      <div className="text-center pt-2">
        <button
          onClick={onStartNewSOS}
          className="text-xs font-bold text-slate-500 hover:text-slate-800 underline p-2"
        >
          Create a Separate Emergency Distress Report
        </button>
      </div>
    </div>
  );
}
