// PerchLink Survivor SOS - Emergency Category Card Component
import React from 'react';
import {
  Lock,
  HeartPulse,
  Bandage,
  Utensils,
  Droplet,
  Flame,
  Building2,
  AlertCircle,
  Check,
} from 'lucide-react';

export const EMERGENCY_CATEGORIES = [
  {
    id: 'TRAPPED',
    label: 'Trapped / Cannot Escape',
    shortLabel: 'Trapped',
    icon: Lock,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    selectedBg: 'bg-amber-600 text-white',
    desc: 'Cannot exit building or debris',
  },
  {
    id: 'MEDICAL',
    label: 'Medical Emergency',
    shortLabel: 'Medical',
    icon: HeartPulse,
    color: 'text-rose-600',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    selectedBg: 'bg-rose-600 text-white',
    desc: 'Critical illness or acute condition',
  },
  {
    id: 'INJURED',
    label: 'Injured Person',
    shortLabel: 'Injured',
    icon: Bandage,
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    selectedBg: 'bg-red-600 text-white',
    desc: 'Bleeding, fracture, or trauma',
  },
  {
    id: 'WATER',
    label: 'Drinking Water Required',
    shortLabel: 'Water',
    icon: Droplet,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    selectedBg: 'bg-blue-600 text-white',
    desc: 'Dehydration / no clean drinking water',
  },
  {
    id: 'FOOD',
    label: 'Food Required',
    shortLabel: 'Food',
    icon: Utensils,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    selectedBg: 'bg-orange-600 text-white',
    desc: 'Emergency rations depleted',
  },
  {
    id: 'FIRE',
    label: 'Fire / Smoke Hazard',
    shortLabel: 'Fire / Smoke',
    icon: Flame,
    color: 'text-red-700',
    bg: 'bg-red-50',
    border: 'border-red-200',
    selectedBg: 'bg-red-700 text-white',
    desc: 'Active blaze, toxic smoke, explosion risk',
  },
  {
    id: 'COLLAPSE',
    label: 'Structural Collapse',
    shortLabel: 'Collapse',
    icon: Building2,
    color: 'text-stone-700',
    bg: 'bg-stone-50',
    border: 'border-stone-200',
    selectedBg: 'bg-stone-700 text-white',
    desc: 'Wall, roof, or bridge failure',
  },
  {
    id: 'OTHER',
    label: 'Other Emergency',
    shortLabel: 'Other',
    icon: AlertCircle,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    selectedBg: 'bg-purple-600 text-white',
    desc: 'Any other critical danger',
  },
];

export default function EmergencyCard({ category, isSelected, onSelect, compact = false }) {
  const Icon = category.icon;

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => onSelect(category.id)}
        className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all active:scale-95 ${
          isSelected
            ? `${category.selectedBg} border-transparent shadow-md scale-102 font-semibold`
            : `${category.bg} ${category.border} hover:border-slate-300 text-slate-800`
        }`}
      >
        <Icon className={`w-6 h-6 mb-1.5 ${isSelected ? 'text-white' : category.color}`} />
        <span className="text-xs font-bold leading-tight">{category.shortLabel}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(category.id)}
      className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all text-left active:scale-[0.99] ${
        isSelected
          ? `${category.selectedBg} border-transparent shadow-md`
          : `${category.bg} ${category.border} hover:border-slate-300 text-slate-800`
      }`}
    >
      <div className="flex items-center space-x-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            isSelected ? 'bg-white/20 text-white' : `${category.bg} ${category.color}`
          }`}
        >
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-bold text-sm leading-tight">{category.label}</h4>
          <p className={`text-xs mt-0.5 ${isSelected ? 'text-white/80' : 'text-slate-500'}`}>
            {category.desc}
          </p>
        </div>
      </div>

      <div
        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border ${
          isSelected
            ? 'bg-white text-slate-900 border-white'
            : 'border-slate-300 bg-white'
        }`}
      >
        {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
      </div>
    </button>
  );
}
