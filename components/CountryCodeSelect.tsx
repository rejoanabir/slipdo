'use client';

import React from 'react';

export interface CountryOption {
  code: string; // ISO 2-letter
  dial: string; // Dial code e.g. '+880'
  name: string; // Country name
}

export const SUPPORTED_COUNTRIES: CountryOption[] = [
  { code: 'BD', dial: '+880', name: 'Bangladesh' },
  { code: 'US', dial: '+1', name: 'United States' },
  { code: 'GB', dial: '+44', name: 'United Kingdom' },
  { code: 'AE', dial: '+971', name: 'United Arab Emirates' },
  { code: 'SA', dial: '+966', name: 'Saudi Arabia' },
  { code: 'IN', dial: '+91', name: 'India' },
  { code: 'CA', dial: '+1', name: 'Canada' },
  { code: 'AU', dial: '+61', name: 'Australia' },
  { code: 'SG', dial: '+65', name: 'Singapore' },
  { code: 'MY', dial: '+60', name: 'Malaysia' },
  { code: 'QA', dial: '+974', name: 'Qatar' },
  { code: 'KW', dial: '+965', name: 'Kuwait' },
  { code: 'OM', dial: '+968', name: 'Oman' },
];

interface CountryCodeSelectProps {
  value: string; // e.g. '+880'
  onChange: (dial: string) => void;
  className?: string;
  disabled?: boolean;
}

export const CountryCodeSelect: React.FC<CountryCodeSelectProps> = ({
  value = '+880',
  onChange,
  className = '',
  disabled = false,
}) => {
  return (
    <div className={`relative inline-flex items-center shrink-0 ${className}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        aria-label="Country Code"
        className="appearance-none h-full pl-3 pr-7 py-3 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-mono font-bold focus:outline-none focus:border-[#3b82f6] focus:ring-2 focus:ring-blue-500/15 cursor-pointer transition-all shadow-2xs"
      >
        {SUPPORTED_COUNTRIES.map((c) => (
          <option key={`${c.code}-${c.dial}`} value={c.dial} className="font-sans text-xs">
            {c.code} ({c.dial})
          </option>
        ))}
      </select>
      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
    </div>
  );
};
