#!/bin/bash
# UniverCert · Verify page + Landing — hide views + highlight "2 modos"

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

# --- Verify: ocultar contagem de views ---
if grep -q "verificação' : 'verificações'" src/app/v/\[id\]/page.tsx 2>/dev/null; then
  echo "==> Patch verify page (hide views count)..."
  python3 <<'PY'
p='src/app/v/[id]/page.tsx'
with open(p) as f: c=f.read()
c=c.replace(
"  const views = await getViewCount(credential.id);\n\n  const status = isRevoked",
"  // S78b: contagem de verificacoes ocultada da UI (foco em credibilidade).\n  // logView() continua rodando pra analytics interno (verify_logs).\n\n  const status = isRevoked"
)
c=c.replace(
'<TrustItem icon="🌎" label="URL pública" sub={`${views.toLocaleString(\'pt-BR\')} ${views === 1 ? \'verificação\' : \'verificações\'}`} />',
'<TrustItem icon="🌎" label="URL pública" sub="Verificável 24/7" />'
)
with open(p,'w') as f: f.write(c)
print('verify ok')
PY
else
  echo "==> verify ja patcheado (skip)"
fi

# --- Landing: feature "2 modos" highlight ---
if ! grep -q "highlight?: boolean" src/lib/landing-data.ts 2>/dev/null; then
  echo "==> Patch landing-data.ts (add highlight type + feature 2 modos)..."
  python3 <<'PY'
p='src/lib/landing-data.ts'
with open(p) as f: c=f.read()
c=c.replace(
"export type Feature = { icon: string; title: ML; desc: ML; cat: string };",
"export type Feature = { icon: string; title: ML; desc: ML; cat: string; highlight?: boolean };"
)
old="  { cat: 'integrations', icon: '🔌', title: { pt: 'Hotmart/Memberkit/Kiwify/Eduzz'"
new=(
"  { cat: 'integrations', icon: '⚡', title: { pt: '2 modos: automático ou aprovação', en: '2 modes: auto or approval-gated', es: '2 modos: automático o por aprobación', fr: '2 modes : auto ou validation' }, "
"desc: { pt: 'Auto-emite via webhook (Hotmart/Kiwify/Memberkit/Fluent) ao concluir, ou exige prova de conhecimento — foto, redação, quiz, documento — antes do aprovador liberar.', "
"en: 'Auto-issue on course completion (Hotmart, Kiwify, Memberkit, Fluent, Zapier), or require proof of knowledge — photo, essay, quiz, document — before reviewer approves.', "
"es: 'Emite solo al completar (Hotmart, Kiwify, Memberkit, Fluent), o exige prueba de conocimiento — foto, redacción, quiz, documento — antes de aprobar.', "
"fr: 'Émission auto à la fin du cours (Hotmart, Kiwify, Memberkit, Fluent), ou preuve de connaissance requise — photo, dissertation, quiz, document — avant validation.' }, "
"highlight: true },\n"
"  { cat: 'integrations', icon: '🔌', title: { pt: 'Hotmart/Memberkit/Kiwify/Eduzz'"
)
c=c.replace(old, "".join(new))
with open(p,'w') as f: f.write(c)
print('landing-data ok')
PY
fi

if ! grep -q "f.highlight ? '1.5px solid" src/app/\[locale\]/page.tsx 2>/dev/null; then
  echo "==> Patch /[locale]/page.tsx (render highlight)..."
  python3 <<'PY'
p='src/app/[locale]/page.tsx'
with open(p) as f: c=f.read()
old="""                  {items.map((f, i) => (
                    <div key={i} style={{ padding: 18, borderRadius: 14, border: '1px solid rgba(0,0,0,0.06)', background: '#fff', transition: 'all 0.2s' }}>
                      <div style={{ fontSize: 26, marginBottom: 8 }}>{f.icon}</div>
                      <h4 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 6px', color: '#0f172a' }}>{pickML(f.title, loc)}</h4>
                      <p style={{ fontSize: 12.5, color: '#64748b', lineHeight: 1.5, margin: 0 }}>{pickML(f.desc, loc)}</p>
                    </div>
                  ))}"""
new="""                  {items.map((f, i) => (
                    <div key={i} style={{
                      padding: 18,
                      borderRadius: 14,
                      border: f.highlight ? '1.5px solid #D4A937' : '1px solid rgba(0,0,0,0.06)',
                      background: f.highlight ? 'linear-gradient(135deg, #fff, #fffbeb)' : '#fff',
                      boxShadow: f.highlight ? '0 4px 16px rgba(212,169,55,0.18)' : 'none',
                      transition: 'all 0.2s',
                    }}>
                      <div style={{ fontSize: 26, marginBottom: 8 }}>{f.icon}</div>
                      <h4 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 6px', color: '#0f172a' }}>{pickML(f.title, loc)}</h4>
                      <p style={{ fontSize: 12.5, color: '#64748b', lineHeight: 1.5, margin: 0 }}>{pickML(f.desc, loc)}</p>
                    </div>
                  ))}"""
c=c.replace(old, new)
with open(p,'w') as f: f.write(c)
print('locale page ok')
PY
fi

git add -A
git diff --cached --stat | tail -8
git commit -m "feat(verify+landing): hide views count + highlight '2 modos' feature

verify page: oculta numero de verificacoes na UI (logView continua pra
analytics interno em verify_logs). Foco em credibilidade.

landing: nova feature destacada em dourado nos 4 idiomas:
'2 modos: automatico ou aprovacao com prova de conhecimento'.
Type Feature ganha campo opcional 'highlight'. Card renderiza com
border dourado + bg gradient + shadow especial quando true." || echo "(nada novo)"

git push 2>&1 | tail -3
echo
echo "Aguardando CI (~3min)..."
sleep 180
curl -s "https://api.github.com/repos/univerbeauty777/univercert/actions/runs?per_page=1" \
  | python3 -c "import sys,json; r=json.load(sys.stdin)['workflow_runs'][0]; print(f\"#{r['run_number']} {r['conclusion']} {r['html_url']}\")"
echo
echo "Testa em:"
echo "  https://univercert.net/v/cred_demo  (verify sem contagem)"
echo "  https://univercert.net/pt           (feature dourada destacada)"
echo
read
