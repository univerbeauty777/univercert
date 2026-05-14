'use client';

import { useEffect, useState } from 'react';

export default function EmittedAgo({ issuedAt }: { issuedAt: number }) {
  const [seconds, setSeconds] = useState<number | null>(null);

  useEffect(() => {
    const compute = () => Math.max(0, Math.floor(Date.now() / 1000 - issuedAt));
    setSeconds(compute());
    const t = setInterval(() => setSeconds(compute()), 1000);
    return () => clearInterval(t);
  }, [issuedAt]);

  return <>Emitido {seconds === null ? 'agora' : `em ${seconds}s`}</>;
}
