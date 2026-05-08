import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
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
          borderRadius: '40px',
          position: 'relative',
        }}
      >
        <div style={{ position: 'absolute', inset: 22, border: '5px solid #D4A937', borderRadius: '50%', opacity: 0.5 }} />
        <div style={{ position: 'absolute', inset: 38, border: '5px solid #D4A937', borderRadius: '50%', opacity: 0.7 }} />
        <div style={{ position: 'absolute', inset: 54, border: '4px solid #D4A937', borderRadius: '50%', opacity: 0.9 }} />
        <div
          style={{
            color: '#D4A937',
            fontSize: 80,
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
