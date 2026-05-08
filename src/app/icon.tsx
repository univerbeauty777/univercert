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
          background: '#1B2D5E',
          borderRadius: '12px',
          position: 'relative',
        }}
      >
        {/* Outer ring */}
        <div
          style={{
            position: 'absolute',
            inset: 8,
            border: '3px solid #D4A937',
            borderRadius: '50%',
            opacity: 0.6,
          }}
        />
        {/* Inner ring */}
        <div
          style={{
            position: 'absolute',
            inset: 16,
            border: '2px solid #D4A937',
            borderRadius: '50%',
            opacity: 0.85,
          }}
        />
        {/* Center check */}
        <div
          style={{
            color: '#D4A937',
            fontSize: 26,
            fontWeight: 900,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2,
          }}
        >
          ✓
        </div>
      </div>
    ),
    { ...size },
  );
}
