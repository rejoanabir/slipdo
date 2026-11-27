import React from 'react';
import { LogoLockup } from '../lib/types';

interface LogoProps {
  lockup?: LogoLockup | 'sparkle-dark' | 'official';
  className?: string;
  size?: number;
}

export const SlipDoLogo: React.FC<LogoProps> = ({
  lockup = 'official',
  className = '',
  size = 36,
}) => {
  // 1. OFFICIAL SLIPDO BRAND LOGO (Modern FinTech Voucher Emblem)
  if (lockup === 'official' || !lockup || lockup === 'voucher-check') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`shrink-0 select-none ${className}`}
        aria-label="SlipDo Official Logo"
      >
        <defs>
          {/* Badge Background Gradient */}
          <linearGradient id="sdBaseGrad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0F172A" />
            <stop offset="0.6" stopColor="#1E293B" />
            <stop offset="1" stopColor="#0B1329" />
          </linearGradient>

          {/* S-Ribbon Gradient */}
          <linearGradient id="sdRibbonGrad" x1="8" y1="12" x2="40" y2="36" gradientUnits="userSpaceOnUse">
            <stop stopColor="#60A5FA" />
            <stop offset="0.5" stopColor="#2563EB" />
            <stop offset="1" stopColor="#1D4ED8" />
          </linearGradient>

          {/* Accent Glow */}
          <linearGradient id="sdAccentGrad" x1="28" y1="8" x2="40" y2="20" gradientUnits="userSpaceOnUse">
            <stop stopColor="#34D399" />
            <stop offset="1" stopColor="#059669" />
          </linearGradient>

          {/* Soft Shadow */}
          <filter id="sdShadow" x="0" y="0" width="48" height="48" filterUnits="userSpaceOnUse">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#0F172A" floodOpacity="0.25" />
          </filter>
        </defs>

        {/* Outer Squircle Container */}
        <rect
          width="48"
          height="48"
          rx="13"
          fill="url(#sdBaseGrad)"
          stroke="#334155"
          strokeWidth="1.2"
        />

        {/* Digital Slip / Receipt Fold Backplate */}
        <path
          d="M13 14C13 11.7909 14.7909 10 17 10H31C33.2091 10 35 11.7909 35 14V21.5C33.6193 21.5 32.5 22.6193 32.5 24C32.5 25.3807 33.6193 26.5 35 26.5V34C35 36.2091 33.2091 38 31 38H17C14.7909 38 13 36.2091 13 34V26.5C14.3807 26.5 15.5 25.3807 15.5 24C15.5 22.6193 14.3807 21.5 13 21.5V14Z"
          fill="#1E293B"
          stroke="#475569"
          strokeWidth="1.5"
        />

        {/* Dynamic 'S' Streamline / Ledger Monogram */}
        <path
          d="M31 16H20C17.7909 16 16 17.7909 16 20C16 22.2091 17.7909 24 20 24H28C30.2091 24 32 25.7909 32 28C32 30.2091 30.2091 32 28 32H17"
          stroke="url(#sdRibbonGrad)"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Receipt Ledger Horizontal Tick Accents */}
        <line x1="20" y1="20" x2="26" y2="20" stroke="#93C5FD" strokeWidth="1.75" strokeLinecap="round" />
        <line x1="22" y1="28" x2="28" y2="28" stroke="#FFFFFF" strokeWidth="1.75" strokeLinecap="round" />

        {/* Verified Security Notch Badge */}
        <circle cx="36" cy="12" r="4.5" fill="url(#sdAccentGrad)" stroke="#0F172A" strokeWidth="1.5" />
        <path
          d="M34.2 12L35.4 13.2L37.8 10.8"
          stroke="#FFFFFF"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  // 2. MODERN SPARKLE DARK (Harmonized with Reference Login Style)
  if (lockup === 'sparkle-dark') {
    return (
      <div
        style={{ width: size, height: size }}
        className={`rounded-2xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-sm shadow-slate-900/20 border border-slate-800 ${className}`}
      >
        <svg
          width={Math.round(size * 0.55)}
          height={Math.round(size * 0.55)}
          viewBox="0 0 24 24"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* 4-pointed star / sparkle mark */}
          <path d="M12 0C12 6.627 6.627 12 0 12C6.627 12 12 17.373 12 24C12 17.373 17.373 12 24 12C17.373 12 12 6.627 12 0Z" />
        </svg>
      </div>
    );
  }

  // 3. MONOGRAM S (Vibrant Blue Minimalist)
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
    >
      <defs>
        <linearGradient id="sdGradMono" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2563eb" />
          <stop offset="1" stopColor="#1d4ed8" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="12" fill="url(#sdGradMono)" />
      <path
        d="M26 13C24.5 11.5 22 11 19.5 11C15.5 11 13 13.5 13 17C13 23 27 20 27 26C27 29.5 24.5 32 19.5 32C16 32 13.5 30.5 12 28.5"
        stroke="#FFFFFF"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <circle cx="27" cy="13" r="2.2" fill="#34D399" />
    </svg>
  );
};
