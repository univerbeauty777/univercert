'use client';

// UniverCert · confetti CSS-only · roda 1x ao montar a página de resultado

import { useEffect, useState } from 'react';

const COLORS = ['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6'];

export default function DemoConfetti() {
  const [pieces, setPieces] = useState<Array<{ id: number; left: number; color: string; delay: number; duration: number }>>([]);

  useEffect(() => {
    const arr = Array.from({ length: 60 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      delay: Math.random() * 0.5,
      duration: 2.5 + Math.random() * 2,
    }));
    setPieces(arr);
    // Limpa após anim pra não acumular DOM
    const t = setTimeout(() => setPieces([]), 5000);
    return () => clearTimeout(t);
  }, []);

  if (pieces.length === 0) return null;

  return (
    <>
      <style>{`
        @keyframes confettiFall {
          0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {pieces.map((p) => (
          <div
            key={p.id}
            style={{
              position: 'absolute',
              top: '-20px',
              left: `${p.left}%`,
              width: '8px',
              height: '14px',
              backgroundColor: p.color,
              animation: `confettiFall ${p.duration}s ${p.delay}s linear forwards`,
              borderRadius: '2px',
            }}
          />
        ))}
      </div>
    </>
  );
}
