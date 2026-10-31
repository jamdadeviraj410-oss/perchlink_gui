// PerchLink Survivor SOS - Delivery Timeline Component
// Transparent, honest message delivery progression through the 5 real-world stages
import React from 'react';
import {
  Smartphone,
  Server,
  Radio,
  Building,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  HelpCircle,
} from 'lucide-react';

export default function DeliveryTimeline({
  status = 'RECEIVED_BY_DRONE',
  transmittingLoRa = false,
  groundStationAcknowledged = false,
  rescueTeamAcknowledged = false,
  timestamps = {},
  isSimulated = true,
  onRetry,
}) {
  // Determine active level:
  // 1: Phone sent
  // 2: Drone Received & Stored
  // 3: Transmitting via LoRa
  // 4: Ground Station Acknowledged
  // 5: Rescue Operator Confirmed
  let currentStage = 2; // drone received is default once saved
  if (rescueTeamAcknowledged) {
    currentStage = 5;
  } else if (groundStationAcknowledged) {
    currentStage = 4;
  } else if (transmittingLoRa || status === 'TRANSMITTING_TO_RESCUE_STATION') {
    currentStage = 3;
  } else if (status === 'SUBMITTING') {
    currentStage = 1;
  }

  const isFailedOrPending = status === 'PENDING_RETRY' || status === 'FAILED';

  const steps = [
    {
      id: 1,
      name: 'Transmitted from Smartphone',
      desc: 'Delivered across local Wi-Fi to PerchLink drone',
      icon: Smartphone,
      time: timestamps.createdAt || 'Just now',
      completed: currentStage >= 1,
      inProgress: currentStage === 1,
    },
    {
      id: 2,
      name: 'Received & Stored by Drone',
      desc: 'Persisted in Raspberry Pi offline database. Safe from power loss.',
      icon: Server,
      time: timestamps.droneReceivedAt || timestamps.createdAt || 'Confirmed',
      completed: currentStage >= 2,
      inProgress: currentStage === 2 && !transmittingLoRa,
    },
    {
      id: 3,
      name: 'Broadcasting via LoRa Radio',
      desc: 'Transmitting packet over SX1262 long-range radio link',
      icon: Radio,
      time: currentStage >= 3 ? 'Active packet broadcast' : 'Queued for transmission',
      completed: currentStage >= 4,
      inProgress: currentStage === 3,
    },
    {
      id: 4,
      name: 'Received by Rescue Station',
      desc: 'Base station antenna received packet and sent radio ACK',
      icon: Building,
      time: timestamps.groundStationAcknowledgedAt || (currentStage >= 4 ? 'ACK confirmed' : 'Awaiting radio ACK'),
      completed: currentStage >= 4,
      inProgress: currentStage === 4 && !rescueTeamAcknowledged,
    },
    {
      id: 5,
      name: 'Rescue Operator Acknowledged',
      desc: 'Emergency response personnel have registered your location & need',
      icon: CheckCircle2,
      time: timestamps.rescueTeamAcknowledgedAt || (currentStage >= 5 ? 'Response confirmed' : 'Pending human review'),
      completed: currentStage >= 5,
      inProgress: false,
    },
  ];

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200">
      {/* Truth In Reporting Alert Callout */}
      <div
        className={`p-3.5 rounded-2xl mb-4 text-xs flex items-start gap-2.5 ${
          currentStage === 5
            ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
            : currentStage >= 4
            ? 'bg-blue-50 text-blue-900 border border-blue-200'
            : 'bg-amber-50 text-amber-900 border border-amber-200'
        }`}
      >
        <AlertTriangle
          className={`w-4 h-4 mt-0.5 shrink-0 ${
            currentStage >= 4 ? 'text-blue-600' : 'text-amber-600'
          }`}
        />
        <div className="leading-relaxed">
          {currentStage === 5 ? (
            <span>
              <strong>Rescue Team Verified:</strong> Human rescue personnel have received your distress call. Stay in a safe position if possible.
            </span>
          ) : currentStage >= 4 ? (
            <span>
              <strong>Station Radio ACK Received:</strong> Drone radio link successfully reached the base station. Awaiting human dispatcher review.
            </span>
          ) : (
            <span>
              <strong>Delivery in Progress:</strong> Your request is saved on the drone. It is currently being relayed across LoRa radio to the ground station.
            </span>
          )}
        </div>
      </div>

      {/* Stepper Timeline */}
      <div className="relative pl-3 space-y-6">
        {/* Connecting Line */}
        <div className="absolute left-[27px] top-4 bottom-4 w-0.5 bg-slate-200 -z-0"></div>

        {steps.map((step) => {
          const StepIcon = step.icon;
          const isDone = step.completed;
          const isCurrent = step.inProgress;

          let badgeColor = 'bg-slate-100 text-slate-400 border-slate-200';
          if (isDone) {
            badgeColor = 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-600/30';
          } else if (isCurrent) {
            badgeColor = 'bg-amber-500 text-white border-amber-500 animate-pulse shadow-sm shadow-amber-500/30';
          }

          return (
            <div key={step.id} className="relative flex items-start space-x-3.5 z-10">
              {/* Step Icon / Circle */}
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center border-2 shrink-0 transition-colors ${badgeColor}`}
              >
                <StepIcon className="w-4 h-4" />
              </div>

              {/* Step Info */}
              <div className="flex-1 pt-0.5">
                <div className="flex items-center justify-between">
                  <h4
                    className={`text-sm font-bold leading-tight ${
                      isDone
                        ? 'text-slate-900'
                        : isCurrent
                        ? 'text-amber-900'
                        : 'text-slate-400'
                    }`}
                  >
                    {step.name}
                  </h4>
                  {isDone && (
                    <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      ✓ Done
                    </span>
                  )}
                  {isCurrent && (
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full animate-pulse">
                      In Progress...
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-500 mt-1 leading-normal">
                  {step.desc}
                </p>

                <div className="text-[11px] font-mono text-slate-400 mt-1">
                  {step.time}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Failure / Retry handler */}
      {isFailedOrPending && onRetry && (
        <div className="mt-5 pt-4 border-t border-slate-100 text-center">
          <p className="text-xs text-amber-700 font-medium mb-2">
            Ground station ACK was not received within the timeout window. Message is preserved on drone storage.
          </p>
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-semibold hover:bg-slate-700 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry LoRa Transmission Now
          </button>
        </div>
      )}
    </div>
  );
}
