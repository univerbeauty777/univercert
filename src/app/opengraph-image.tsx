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
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)',
          padding: '80px',
          color: 'white',
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-200px',
            right: '-200px',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
            filter: 'blur(40px)',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '40px' }}>
          <div
            style={{
              width: '70px',
              height: '70px',
              borderRadius: '20px',
              background: 'rgba(255,255,255,0.95)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '40px',
            }}
          >
            🏆
          </div>
          <div style={{ fontSize: '38px', fontWeight: 800, letterSpacing: '-0.02em' }}>UniverCert</div>
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
            opacity: 0.9,
            marginTop: 'auto',
            display: 'flex',
            gap: '24px',
          }}
        >
          <span>🇧🇷 Pix · Boleto · WhatsApp</span>
          <span>·</span>
          <span>univercert.com.br</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
