#!/bin/bash
# UniverCert · GODMODE Dark Mode D (Stripe-like warm indigo)
# Aplica a paleta D no globals.css + push.

set -e
cd "$(dirname "$0")"
rm -f .git/index.lock 2>/dev/null || true

echo "==> Fetch + reset..."
git fetch origin main 2>&1 | tail -3
LOCAL=$(git rev-parse HEAD); REMOTE=$(git rev-parse origin/main)
if [ "$LOCAL" != "$REMOTE" ]; then
  git stash -u 2>/dev/null || true
  git reset --hard origin/main
  git stash pop 2>/dev/null || true
fi

# Aplica/re-aplica o bloco .dark (idempotente)
if grep -q "Proposta D (Stripe-like warm indigo)" src/app/globals.css; then
  echo "==> globals.css ja tem a paleta D (skip)"
else
  echo "==> Aplicando paleta D no globals.css..."
  python3 <<'PY'
import re
p = 'src/app/globals.css'
with open(p) as f: c = f.read()
new_dark = """.dark {
  /* GODMODE Dark — Proposta D (Stripe-like warm indigo) — 17/Mai/2026 */
  --bg: 14 15 23;               /* page bg warm indigo #0e0f17 */
  --surface: 23 25 39;          /* cards #171927 */
  --surface-2: 31 34 56;        /* nested #1f2238 */
  --surface-3: 42 46 72;        /* hover/pressed #2a2e48 */
  --fg: 246 247 251;            /* primary text #f6f7fb */
  --fg-muted: 160 164 184;      /* labels #a0a4b8 — alto contraste */
  --fg-subtle: 107 111 134;     /* hints/disabled #6b6f86 */
  --border: 46 50 71;           /* #2e3247 — bem visivel sem brigar */
  --border-strong: 58 63 87;    /* #3a3f57 */
  --brand: 124 143 244;         /* navy claro #7c8ff4 — preserva identidade */
  --brand-fg: 14 15 23;         /* texto sobre brand */
  --brand-soft: 31 36 68;       /* hover/badge bg do brand */
  --gold: 252 211 77;           /* #fcd34d — alto contraste pra premium/CTAs */
  --gold-soft: 58 46 13;        /* tom escuro pra fundo de badge gold */
  --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.40);
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.50), 0 1px 2px rgba(0, 0, 0, 0.40);
  --shadow-md: 0 4px 12px -2px rgba(0, 0, 0, 0.55), 0 2px 4px -1px rgba(0, 0, 0, 0.40);
  --shadow-lg: 0 12px 32px -8px rgba(0, 0, 0, 0.65), 0 4px 8px -2px rgba(0, 0, 0, 0.45);
  --shadow-glow: 0 0 0 4px rgba(124, 143, 244, 0.20);
}"""
c = re.sub(r"\.dark \{[^}]+\}", new_dark, c, count=1, flags=re.DOTALL)
with open(p, 'w') as f: f.write(c)
print('paleta D aplicada')
PY
fi

git add -A
git diff --cached --stat | tail -5
git commit -m "feat(theme): GODMODE dark mode D (Stripe-like warm indigo)

Paleta nova pro .dark em globals.css:
- bg #0e0f17 warm indigo (vs preto puro do anterior)
- surface #171927 / surface-2 #1f2238 — hierarquia visivel
- brand #7c8ff4 navy claro mais nitido (vs #8291c8 desbotado)
- gold #fcd34d alto contraste pra premium/CTAs/badges
- borders #2e3247 visiveis sem brigar com cards
- fg-muted #a0a4b8 alto contraste (texto secundario legivel)
- shadows com opacity maior pra dar profundidade no escuro

Escolhida pelo Diego entre 4 propostas comparadas em preview HTML." || echo "(nada novo)"

git push 2>&1 | tail -3
echo
echo "Aguardando CI build (~3min)..."
sleep 180
curl -s "https://api.github.com/repos/univerbeauty777/univercert/actions/runs?per_page=1" \
  | python3 -c "import sys,json; r=json.load(sys.stdin)['workflow_runs'][0]; print(f\"#{r['run_number']} {r['conclusion']} {r['html_url']}\")"
echo
echo "Depois de verde, faz hard refresh (Cmd+Shift+R) em https://univercert.net/dashboard"
echo "Vai estar com fundo warm indigo, gold mais vivo e maior contraste em tudo."
echo
read
