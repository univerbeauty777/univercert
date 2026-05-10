// UniverCert · Plans + plan limits (S35 + S36)
// 4 planos: free / starter / pro / enterprise

export type PlanId = 'free' | 'starter' | 'pro' | 'enterprise';

export type Plan = {
  id: PlanId;
  name: string;
  tagline: string;
  monthlyBrlCents: number;        // -1 = custom
  yearlyBrlCents: number;         // 10x monthly (2 meses gratis)
  stripePriceIdMonthly?: string;
  stripePriceIdYearly?: string;
  pagarmePlanId?: string;          // Pagar.me plan id (PIX BR)
  limits: {
    certsPerMonth: number;        // -1 = unlimited
    aiJobsPerMonth: number;       // -1 = unlimited
    teamMembers: number;          // -1 = unlimited
    workspaces: number;
    customDomain: boolean;
    removeWatermark: boolean;
    apiKeys: boolean;
    sso: boolean;
    auditExport: boolean;
    prioritySupport: boolean;
    bulkExport: boolean;
  };
  features: string[];
  cta: string;
  popular?: boolean;
};

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: 'free',
    name: 'Free',
    tagline: 'Pra começar e testar',
    monthlyBrlCents: 0,
    yearlyBrlCents: 0,
    limits: {
      certsPerMonth: 50,
      aiJobsPerMonth: 5,
      teamMembers: 1,
      workspaces: 1,
      customDomain: false,
      removeWatermark: false,
      apiKeys: false,
      sso: false,
      auditExport: false,
      prioritySupport: false,
      bulkExport: false,
    },
    features: ['50 certificados/mês', '1 usuário', 'Templates prontos', 'Verificação pública', 'Marca UniverCert no PDF'],
    cta: 'Começar grátis',
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    tagline: 'Pra escolas pequenas',
    monthlyBrlCents: 9700,         // R$97
    yearlyBrlCents: 97000,         // R$970 (R$80.83/mes)
    stripePriceIdMonthly: 'price_starter_monthly',
    stripePriceIdYearly: 'price_starter_yearly',
    pagarmePlanId: 'plan_starter_brl',
    limits: {
      certsPerMonth: 500,
      aiJobsPerMonth: 50,
      teamMembers: 3,
      workspaces: 1,
      customDomain: false,
      removeWatermark: false,
      apiKeys: false,
      sso: false,
      auditExport: false,
      prioritySupport: false,
      bulkExport: true,
    },
    features: ['500 certificados/mês', '3 usuários', 'Bulk export', 'Email + WhatsApp dispatch', 'Webhooks Hotmart/Memberkit'],
    cta: 'Começar Starter',
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    tagline: 'Pra escolas que crescem',
    monthlyBrlCents: 29700,         // R$297
    yearlyBrlCents: 297000,         // R$2.970 (R$247.50/mes)
    stripePriceIdMonthly: 'price_pro_monthly',
    stripePriceIdYearly: 'price_pro_yearly',
    pagarmePlanId: 'plan_pro_brl',
    limits: {
      certsPerMonth: 5000,
      aiJobsPerMonth: 500,
      teamMembers: 15,
      workspaces: 3,
      customDomain: true,
      removeWatermark: true,
      apiKeys: true,
      sso: false,
      auditExport: true,
      prioritySupport: true,
      bulkExport: true,
    },
    features: ['5.000 certificados/mês', '15 usuários', '3 workspaces', 'Domínio próprio', 'Sem marca UniverCert', 'API keys', 'Audit export', 'Suporte prioritário'],
    cta: 'Começar Pro',
    popular: true,
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    tagline: 'Pra grandes operações',
    monthlyBrlCents: -1,
    yearlyBrlCents: -1,
    limits: {
      certsPerMonth: -1,
      aiJobsPerMonth: -1,
      teamMembers: -1,
      workspaces: -1,
      customDomain: true,
      removeWatermark: true,
      apiKeys: true,
      sso: true,
      auditExport: true,
      prioritySupport: true,
      bulkExport: true,
    },
    features: ['Certificados ilimitados', 'Usuários ilimitados', 'SSO Google/Microsoft/SAML', 'White-label total', 'SLA 99.9%', 'Account manager dedicado', 'Onboarding personalizado', 'Auditoria SOC 2'],
    cta: 'Falar com vendas',
  },
};

export function getPlan(id: string): Plan {
  return PLANS[(id as PlanId) ?? 'free'] ?? PLANS.free;
}

export function formatPrice(cents: number): string {
  if (cents === -1) return 'Custom';
  if (cents === 0) return 'Grátis';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(cents / 100);
}

/** Yearly = monthly × 10 (2 meses grátis). Show savings. */
export function yearlySavingsBrlCents(plan: Plan): number {
  if (plan.monthlyBrlCents <= 0) return 0;
  return plan.monthlyBrlCents * 12 - plan.yearlyBrlCents;
}

/** Period YYYY-MM corrente */
export function currentPeriodYM(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}
