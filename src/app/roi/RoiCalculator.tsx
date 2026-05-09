'use client';

// UniverCert · ROI Calculator interativo

import { useMemo, useState } from 'react';

const PLANS = [
  { id: 'free', name: 'Free', price: 0, certsIncluded: 50 },
  { id: 'starter', name: 'Starter', price: 97, certsIncluded: 500 },
  { id: 'pro', name: 'Pro', price: 297, certsIncluded: 5000 },
] as const;

function fmt(n: number, currency = false): string {
  if (currency) return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  return n.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
}

export default function RoiCalculator() {
  const [certsMonth, setCertsMonth] = useState(80);
  const [ticket, setTicket] = useState(497);
  const [hourlyRate, setHourlyRate] = useState(50);

  const planAuto = useMemo(() => {
    if (certsMonth <= 50) return PLANS[0];
    if (certsMonth <= 500) return PLANS[1];
    return PLANS[2];
  }, [certsMonth]);

  const calc = useMemo(() => {
    // ECONOMIA DE TEMPO
    // Manualmente: ~8 min por cert (Canva edit + email + arquivar)
    // UniverCert: ~30s (1-click ou automático via webhook)
    const minutesSavedPerCert = 7.5;
    const hoursSavedMonth = (certsMonth * minutesSavedPerCert) / 60;
    const hoursValue = hoursSavedMonth * hourlyRate;

    // MARKETING ORGÂNICO
    // ~25% dos alunos compartilham cert no LinkedIn/Insta
    // Cada share alcança ~150 pessoas (média BR)
    // Custo equivalente em ads (CPM R$ 12 BR): impressions / 1000 * 12
    const shareRate = 0.25;
    const reachPerShare = 150;
    const impressionsMonth = certsMonth * shareRate * reachPerShare;
    const cpmEquivalent = (impressionsMonth / 1000) * 12;

    // CONVERSÃO INDIRETA
    // ~1.5% das impressions viram lead → ~10% dos leads viram aluno
    const leadsMonth = impressionsMonth * 0.015;
    const newStudentsMonth = leadsMonth * 0.10;
    const newRevenueMonth = newStudentsMonth * ticket;

    // RETENÇÃO (NPS via WhatsApp)
    // Alunos que recebem cert por WhatsApp têm ~12% mais chance de comprar próximo curso
    const upsellLift = 0.12;
    const upsellRevenue = certsMonth * 0.30 * ticket * upsellLift; // 30% base voltam a comprar

    // CUSTO UNIVERCERT
    const planCost = planAuto.price;

    // ROI
    const totalGain = hoursValue + cpmEquivalent + newRevenueMonth + upsellRevenue;
    const netGain = totalGain - planCost;
    const roi = planCost > 0 ? (netGain / planCost) * 100 : Infinity;
    const paybackDays = planCost > 0 && totalGain > 0 ? (planCost / (totalGain / 30)) : 0;

    return {
      hoursSavedMonth,
      hoursValue,
      impressionsMonth,
      cpmEquivalent,
      newStudentsMonth,
      newRevenueMonth,
      upsellRevenue,
      planCost,
      totalGain,
      netGain,
      roi,
      paybackDays,
    };
  }, [certsMonth, ticket, hourlyRate, planAuto]);

  return (
    <div className="grid lg:grid-cols-5 gap-6">
      {/* INPUTS */}
      <div className="lg:col-span-2 card !p-7">
        <h2 className="font-display text-2xl font-semibold tracking-tight mb-1">Sua escola</h2>
        <p className="text-sm text-ink-500 mb-7">Insira os números aproximados pra ver o impacto.</p>

        <div className="space-y-7">
          <SliderField
            label="Certificados emitidos por mês"
            value={certsMonth}
            min={10}
            max={2000}
            step={10}
            onChange={setCertsMonth}
            format={(v) => v.toLocaleString('pt-BR')}
          />
          <SliderField
            label="Ticket médio do curso"
            value={ticket}
            min={47}
            max={5000}
            step={10}
            onChange={setTicket}
            format={(v) => `R$ ${fmt(v)}`}
          />
          <SliderField
            label="Custo da sua hora (R$)"
            value={hourlyRate}
            min={20}
            max={300}
            step={5}
            onChange={setHourlyRate}
            format={(v) => `R$ ${fmt(v)}/h`}
            hint="Quanto vale uma hora do seu trabalho ou do seu time?"
          />
        </div>

        <div className="mt-7 pt-6 border-t border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase tracking-widest text-ink-500 font-bold">Plano recomendado</span>
            <span className="badge-primary">{planAuto.name}</span>
          </div>
          <div className="font-display text-3xl font-semibold tracking-tight">
            {planAuto.price === 0 ? 'Grátis' : `R$ ${planAuto.price}`}
            {planAuto.price > 0 && <span className="text-sm text-ink-500 font-medium">/mês</span>}
          </div>
          <p className="text-xs text-ink-500 mt-1">{planAuto.certsIncluded} certs incluídos no plano</p>
        </div>
      </div>

      {/* OUTPUTS */}
      <div className="lg:col-span-3 space-y-3">
        {/* Hero result */}
        <div className="card relative overflow-hidden p-7 bg-gradient-to-br from-primary via-primary to-primary-dark text-white">
          <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full opacity-30 blur-3xl bg-gradient-to-br from-accent to-primary" />
          <div className="relative">
            <div className="text-[10px] uppercase tracking-widest text-accent font-bold mb-2">
              💰 Economia + retorno mensal estimado
            </div>
            <div className="font-display text-5xl md:text-6xl font-semibold tracking-tight leading-none mb-2">
              {fmt(calc.totalGain, true)}
            </div>
            <p className="text-sm text-white/80">
              {planAuto.price > 0 ? (
                <>
                  Net <strong className="text-accent">{fmt(calc.netGain, true)}</strong> ·
                  ROI <strong className="text-accent">{fmt(calc.roi)}%</strong> ·
                  Payback em <strong className="text-accent">{fmt(Math.round(calc.paybackDays))} dias</strong>
                </>
              ) : (
                <>Plano grátis · Tudo isso é puro ganho.</>
              )}
            </p>
          </div>
        </div>

        {/* Breakdown */}
        <div className="grid sm:grid-cols-2 gap-3">
          <BreakdownCard
            icon="⏱"
            title="Tempo economizado"
            value={`${fmt(calc.hoursSavedMonth)} h/mês`}
            money={fmt(calc.hoursValue, true)}
            desc="vs. fazer cert manualmente no Canva (8min/cert) — automatizado é < 30s"
          />
          <BreakdownCard
            icon="📣"
            title="Marketing orgânico"
            value={`${fmt(calc.impressionsMonth)} views`}
            money={fmt(calc.cpmEquivalent, true)}
            desc="Equivalente em ads pra alcançar mesma impressão (CPM R$ 12 BR)"
            tone="gold"
          />
          <BreakdownCard
            icon="🎯"
            title="Novos alunos via share"
            value={`${fmt(calc.newStudentsMonth)} alunos/mês`}
            money={fmt(calc.newRevenueMonth, true)}
            desc="1.5% leads das views × 10% conversão × seu ticket médio"
            tone="success"
          />
          <BreakdownCard
            icon="🔁"
            title="Upsell via NPS WhatsApp"
            value="+12% retenção"
            money={fmt(calc.upsellRevenue, true)}
            desc="Aluno que recebe cert por Zap volta mais. NPS D+7 automático"
            tone="primary"
          />
        </div>

        <div className="card !p-4 text-xs text-ink-500 leading-relaxed">
          <strong>📊 Premissas:</strong> 8min/cert manual · 25% taxa de share · 150 alcance/share · CPM R$ 12 (média BR Meta Ads) ·
          1.5% conversão impressions→lead · 10% conversão lead→aluno · 12% lift de upsell por share via WhatsApp.
          Números conservadores baseados em benchmarks de cursos online BR.
        </div>
      </div>
    </div>
  );
}

function SliderField({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
  hint,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format: (v: number) => string;
  hint?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="label !mb-0">{label}</label>
        <span className="font-display text-2xl font-semibold tracking-tight text-primary">
          {format(value)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-primary"
      />
      {hint && <p className="text-xs text-ink-500 mt-1.5">{hint}</p>}
    </div>
  );
}

function BreakdownCard({
  icon,
  title,
  value,
  money,
  desc,
  tone = 'primary',
}: {
  icon: string;
  title: string;
  value: string;
  money: string;
  desc: string;
  tone?: 'primary' | 'gold' | 'success';
}) {
  const toneClasses: Record<string, string> = {
    primary: 'bg-primary-soft text-primary-dark',
    gold: 'bg-gold/10 text-amber-700',
    success: 'bg-success/10 text-success',
  };
  return (
    <div className="card !p-5">
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${toneClasses[tone]}`}>
          {icon}
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-widest text-ink-500 font-bold">{title}</div>
          <div className="font-display text-xl font-semibold tracking-tight">{value}</div>
        </div>
      </div>
      <div className="text-sm font-bold text-success mb-1">≈ {money}/mês</div>
      <p className="text-xs text-ink-500 leading-relaxed">{desc}</p>
    </div>
  );
}
