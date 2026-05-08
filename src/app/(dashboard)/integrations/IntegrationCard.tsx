'use client';

import { useState, useTransition } from 'react';
import { upsertIntegrationAction, generateSecretAction } from './actions';

type Props = {
  provider: 'fluent' | 'hotmart' | 'memberkit' | 'kiwify' | 'eduzz' | 'hubla';
  name: string;
  emoji: string;
  description: string;
  webhookUrl: string;
  isActive: boolean;
  hasSecret: boolean;
};

export default function IntegrationCard({ provider, name, emoji, description, webhookUrl, isActive, hasSecret }: Props) {
  const [active, setActive] = useState(isActive);
  const [secretSet, setSecretSet] = useState(hasSecret);
  const [secret, setSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleToggle = () => {
    startTransition(async () => {
      const res = await upsertIntegrationAction({ provider, isActive: !active });
      if (res.ok) setActive(!active);
    });
  };

  const handleGenerateSecret = () => {
    startTransition(async () => {
      const res = await generateSecretAction(provider);
      if (res.ok && res.secret) {
        setSecret(res.secret);
        setShowSecret(true);
        setSecretSet(true);
      }
    });
  };

  return (
    <div className="card flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="text-3xl">{emoji}</div>
          <div>
            <h3 className="font-bold">{name}</h3>
            <p className="text-xs text-gray-500">{description}</p>
          </div>
        </div>
        <label className="inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={active}
            onChange={handleToggle}
            disabled={isPending}
            className="sr-only peer"
          />
          <div className="relative w-11 h-6 bg-gray-200 rounded-full peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
        </label>
      </div>

      <div className="bg-gray-50 rounded-lg p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs uppercase tracking-wider text-gray-500 font-bold">Webhook URL</span>
          <button onClick={handleCopy} className="text-xs text-primary font-semibold hover:underline">
            {copied ? '✓ Copiado!' : 'Copiar'}
          </button>
        </div>
        <code className="text-xs font-mono text-gray-700 break-all block">{webhookUrl}</code>
      </div>

      <div className="bg-gray-50 rounded-lg p-3">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-xs uppercase tracking-wider text-gray-500 font-bold">
            Secret (HMAC) {secretSet && '·'}{' '}
            {secretSet && <span className="text-success normal-case">configurado ✓</span>}
          </span>
          <button onClick={handleGenerateSecret} disabled={isPending} className="text-xs text-primary font-semibold hover:underline">
            {isPending ? '...' : secretSet ? 'Regenerar' : 'Gerar secret'}
          </button>
        </div>
        {showSecret && secret && (
          <div className="mt-2">
            <code className="text-xs font-mono text-gray-700 break-all bg-white border border-yellow-300 p-2 rounded block">
              {secret}
            </code>
            <p className="text-xs text-warning mt-1">
              ⚠ Cole esse secret na sua conta {name} agora — ele não será mostrado de novo.
            </p>
          </div>
        )}
        {!showSecret && !secretSet && (
          <p className="text-xs text-gray-500">
            Sem secret = qualquer um pode disparar o webhook. <strong>Recomendado: gere um.</strong>
          </p>
        )}
      </div>
    </div>
  );
}
