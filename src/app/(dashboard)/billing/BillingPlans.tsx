'use client';

import { useState, useTransition } from 'react';
import { startCheckoutAction } from './actions';

const PLANS = [
  { id: 'free', name: 'Free', price: 'R$ 0', features: ['50 cert/mês', '5 templates', 'Marca UniverCert'], cta: 'Atual', disabled: true },
  { id: 'starter', name: 'Starter', price: 'R$ 97', popular: true, features: ['500 cert/mês', '50 templates', 'WhatsApp + Email', 'Hotmart/Memberkit/Fluent'] },
  { id: 'pro', name: 'Pro', price: 'R$ 297', features: ['5000 cert/mês', 'Domínio próprio', 'Brand Kit + email custom', 'Multi-user', 'API + Webhooks'] },
  { id: 'enterprise', name: 'Enterprise', price: 'R$ 1.497', features: ['Ilimitado', 'SSO/SAML', 'Multi-tenant', 'Reseller', 'SLA 99.9%'] },
] as const;

export default function BillingPlans({ currentPlan }: { currentPlan: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = (plan: 'starter' | 'pro' | 'enterprise') => {
    setError(null);
    startTransition(async () => {
      const result = await startCheckoutAction({ plan });
      if (result.ok && result.initPoint) {
        window.location.href = result.initPoint;
      } else {
        setError(result.error ?? 'Erro ao iniciar checkout');
      }
    });
  };

  return (
    <>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {PLANS.map((p) => {
          const isCurrent = p.id === currentPlan;
          return (
            <div
              key={p.id}
              className={`card flex flex-col ${
                'popular' in p && p.popular ? 'border-2 border-primary -translate-y-2 shadow-lg' : ''
              } ${isCurrent ? 'ring-2 ring-success' : ''}`}
            >
              {'popular' in p && p.popular && (
                <div className="text-xs font-bold text-white bg-gradient-to-r from-primary to-accent text-center py-1 -mt-9 mb-3 rounded-full mx-auto px-3 w-fit">
                  Mais popular
                </div>
              )}
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">{p.name}</div>
              <div className="text-3xl font-extrabold mt-2">
                {p.price}
                <span className="text-sm text-gray-400 font-medium">/mês</span>
              </div>
              <ul className="text-sm space-y-1 mt-4 mb-5 flex-1">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2 text-gray-700">
                    <span className="text-success">✓</span> {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => p.id !== 'free' && handleCheckout(p.id as any)}
                disabled={isCurrent || ('disabled' in p && p.disabled) || isPending}
                className={`text-center font-bold text-sm py-2.5 rounded-xl ${
                  isCurrent
                    ? 'bg-success/10 text-success cursor-default'
                    : 'btn-primary justify-center'
                } ${isPending ? 'opacity-50' : ''}`}
              >
                {isCurrent ? 'Plano atual' : isPending ? '...' : `Assinar ${p.name}`}
              </button>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-500 text-center mt-6">
        Pagamento via Mercado Pago · Pix · Boleto · Cartão de crédito (até 12x) · NF-e emitida automaticamente
      </p>
    </>
  );
}
