import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'UniverCert · Certificados digitais brasileiros';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #0F1B3E 0%, #1B2D5E 50%, #2A4080 100%)',
          padding: '80px',
          color: 'white',
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
        }}
      >
        {/* Gold accent blob */}
        <div
          style={{
            position: 'absolute',
            top: '-100px',
            right: '-100px',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'rgba(212,169,55,0.20)',
            filter: 'blur(60px)',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '40px' }}>
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '20px',
              background: '#0F1B3E',
              border: '4px solid #D4A937',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#D4A937',
              fontSize: '44px',
              fontWeight: 900,
            }}
          >
            ✓
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline' }}>
            <span style={{ fontSize: 44, fontWeight: 900, letterSpacing: '-0.02em', color: 'white' }}>univer</span>
            <span style={{ fontSize: 44, fontWeight: 900, letterSpacing: '-0.02em', color: '#D4A937' }}>CERT</span>
          </div>
        </div>

        <div
          style={{
            fontSize: '88px',
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: '-0.03em',
            marginBottom: '30px',
            maxWidth: '900px',
            display: 'flex',
          }}
        >
          Certificados que seus alunos querem compartilhar.
        </div>

        <div
          style={{
            fontSize: '28px',
            opacity: 0.85,
            marginTop: 'auto',
            display: 'flex',
            gap: '24px',
            color: '#D4A937',
          }}
        >
          <span>🇧🇷 Pix · Boleto · WhatsApp</span>
          <span style={{ color: 'white', opacity: 0.5 }}>·</span>
          <span style={{ color: 'white' }}>univercert.com.br</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
