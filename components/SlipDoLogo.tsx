import React from 'react';
import { LogoLockup } from '../lib/types';

interface LogoProps {
  lockup?: LogoLockup;
  className?: string;
  size?: number;
}

export const SlipDoLogo: React.FC<LogoProps> = ({
  lockup = 'voucher-check',
  className = 'w-9 h-9',
  size = 36,
}) => {
  if (lockup === 'monogram-s') {
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
            <stop stopColor="#059669" />
            <stop offset="1" stopColor="#0D9488" />
          </linearGradient>
        </defs>
        <rect width="40" height="40" rx="12" fill="url(#sdGradMono)" />
        <path
          d="M26 13C24.5 11.5 22 11 19.5 11C15.5 11 13 13.5 13 17C13 23 27 20 27 26C27 29.5 24.5 32 19.5 32C16 32 13.5 30.5 12 28.5"
          stroke="#FFFFFF"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        <circle cx="27" cy="13" r="2" fill="#34D399" />
      </svg>
    );
  }

  // DEFAULT: 'voucher-check' (Voucher slip with perforation notches + checkmark)
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
        <linearGradient id="sdGradVoucher" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#059669" />
          <stop offset="1" stopColor="#0D9488" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="12" fill="url(#sdGradVoucher)" />
      {/* Curved Voucher Outline with Perforation Notches */}
      <path
        d="M11 10C11 8.89543 11.8954 8 13 8H27C28.1046 8 29 8.89543 29 10V18.5C27.6193 18.5 26.5 19.6193 26.5 21C26.5 22.3807 27.6193 23.5 29 23.5V30C29 31.1046 28.1046 32 27 32H13C11.8954 32 11 31.1046 11 30V23.5C12.3807 23.5 13.5 22.3807 13.5 21C13.5 19.6193 12.3807 18.5 11 18.5V10Z"
        fill="#FFFFFF"
        fillOpacity="0.2"
        stroke="#FFFFFF"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      {/* Distinct Checkmark */}
      <path
        d="M16 20.5L19.5 24L25 17"
        stroke="#FFFFFF"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
