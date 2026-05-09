// UniverCert · favicon dinamico (escudo oficial navy + check dourado)
// Next 15 file convention: gera o icon em runtime via ImageResponse.

import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 64, height: 64 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
        }}
      >
        <svg
          width="64"
          height="64"
          viewBox="0 0 100 110"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="s" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1B2D5E" />
              <stop offset="100%" stopColor="#0F1B3E" />
            </linearGradient>
            <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#E8BF4F" />
              <stop offset="100%" stopColor="#D4A937" />
            </linearGradient>
          </defs>
          <path
            d="M50 4 C50 4, 18 10, 12 14 L12 52 C12 76, 28 96, 50 106 C72 96, 88 76, 88 52 L88 14 C82 10, 50 4, 50 4 Z"
            fill="url(#s)"
          />
          <circle cx="50" cy="56" r="32" fill="none" stroke="url(#g)" strokeWidth="2.5" opacity="0.55" />
          <circle cx="50" cy="56" r="24" fill="none" stroke="url(#g)" strokeWidth="2.5" opacity="0.75" />
          <circle cx="50" cy="56" r="14" fill="#0F1B3E" />
          <path
            d="M42 56 L48 62 L60 50"
            stroke="url(#g)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </div>
    ),
    { ...size },
  );
}
