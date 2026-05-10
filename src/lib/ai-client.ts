// UniverCert · Claude API client (S28)
// Edge-compatible (fetch-based, no SDK).

import { getRequestContext } from '@cloudflare/next-on-pages';

export type ClaudeModel = 'claude-haiku-4-5-20251001' | 'claude-sonnet-4-6' | 'claude-opus-4-6';

export type ClaudeMessage = {
  role: 'user' | 'assistant';
  content: string | Array<{ type: 'text'; text: string } | { type: 'image'; source: { type: 'base64'; media_type: string; data: string } }>;
};

export type ClaudeRequest = {
  model: ClaudeModel;
  max_tokens: number;
  messages: ClaudeMessage[];
  system?: string;
  temperature?: number;
};

export type ClaudeResponse = {
  id: string;
  type: 'message';
  role: 'assistant';
  content: Array<{ type: 'text'; text: string }>;
  model: string;
  stop_reason: string;
  usage: { input_tokens: number; output_tokens: number };
};

const MODEL_PRICING_USD = {
  'claude-haiku-4-5-20251001': { input: 1.0, output: 5.0 },
  'claude-sonnet-4-6': { input: 3.0, output: 15.0 },
  'claude-opus-4-6': { input: 15.0, output: 75.0 },
} as const;

const USD_BRL = 5.5;

/** Custo em centavos BRL */
export function estimateCostBrlCents(model: ClaudeModel, inputTokens: number, outputTokens: number): number {
  const p = MODEL_PRICING_USD[model] ?? MODEL_PRICING_USD['claude-haiku-4-5-20251001'];
  const usd = (inputTokens / 1_000_000) * p.input + (outputTokens / 1_000_000) * p.output;
  return Math.ceil(usd * USD_BRL * 100);
}

export async function callClaude(req: ClaudeRequest): Promise<ClaudeResponse> {
  const { env } = getRequestContext();
  const apiKey = (env as any).ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY nao configurada nas env vars do Cloudflare Pages');

  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(req),
  });

  if (!r.ok) {
    const errText = await r.text();
    throw new Error(`Claude API ${r.status}: ${errText.slice(0, 500)}`);
  }
  return await r.json() as ClaudeResponse;
}

/** Helper: extrai JSON de uma resposta de Claude (com tolerancia a code blocks markdown) */
export function extractJson<T = any>(text: string): T {
  let cleaned = text.trim();
  // Remove ```json ... ``` ou ``` ... ```
  cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  // Tenta achar primeiro { e ultimo }
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }
  return JSON.parse(cleaned);
}
