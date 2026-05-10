// UniverCert · Footer (logo navy/gold)

import Logo from './Logo';

export default function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-400 pt-14 pb-8 text-sm">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-10">
          {/* Brand */}
          <div className="col-span-2">
            <a href="/" className="flex items-center gap-2.5 mb-3">
              <Logo size={36} variant="mark-light" />
              <span className="font-extrabold text-white text-lg">
                <span className="text-white">univer</span>
                <span className="text-accent">CERT</span>
              </span>
            </a>
            <p className="text-xs leading-relaxed max-w-xs">
              A plataforma brasileira de certificados digitais. Pix, Boleto, NF-e, WhatsApp.
              Construído com Cloudflare D1 + R2 · LGPD-ready · feito no Brasil.
            </p>
            <div className="flex gap-3 mt-4">
              <SocialLink href="https://wa.me/5511999998888" label="WhatsApp">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448L.057 24z"/></svg>
              </SocialLink>
              <SocialLink href="https://instagram.com/univercert" label="Instagram">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
              </SocialLink>
              <SocialLink href="https://linkedin.com/company/univercert" label="LinkedIn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.063 2.063 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </SocialLink>
            </div>
          </div>

          {/* Produto */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-white mb-4">Produto</h4>
            <ul className="space-y-2 text-xs">
              <FooterLink href="/#features">Recursos</FooterLink>
              <FooterLink href="/#integracoes">Integrações</FooterLink>
              <FooterLink href="/#precos">Preços</FooterLink>
              <FooterLink href="/roi">🧮 ROI calculator</FooterLink>
              <FooterLink href="/reseller">Reseller Program</FooterLink>
            </ul>
          </div>

          {/* Comparativos */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-white mb-4">Comparar</h4>
            <ul className="space-y-2 text-xs">
              <FooterLink href="/vs/certifier">vs Certifier 🇺🇸</FooterLink>
              <FooterLink href="/vs/sertifier">vs Sertifier 🇹🇷</FooterLink>
              <FooterLink href="/vs/canva">vs Canva</FooterLink>
              <FooterLink href="/casos">Por nicho</FooterLink>
              <FooterLink href="/casos/cabelo">💇 Cabelo</FooterLink>
              <FooterLink href="/casos/online">💻 Cursos online</FooterLink>
            </ul>
          </div>

          {/* Recursos */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-white mb-4">Começar</h4>
            <ul className="space-y-2 text-xs">
              <FooterLink href="/demo">🧪 Demo · sem cadastro</FooterLink>
              <FooterLink href="/verificar">🔐 Verificar certificado</FooterLink>
              <FooterLink href="/sign-up">Criar conta grátis</FooterLink>
              <FooterLink href="/uh/solicitar">Pedir certificado</FooterLink>
              <FooterLink href="https://developer.univercert.net">API Docs</FooterLink>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-white mb-4">Legal</h4>
            <ul className="space-y-2 text-xs">
              <FooterLink href="/termos">Termos de Uso</FooterLink>
              <FooterLink href="/privacidade">Privacidade</FooterLink>
              <FooterLink href="/lgpd">LGPD · DPO</FooterLink>
              <FooterLink href="mailto:diegoxp12@me.com">Contato</FooterLink>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row gap-3 md:items-center justify-between text-xs">
          <div className="text-gray-500">
            © 2026 UniverCert · DXPRO Univerbeauty Tecnologia LTDA · CNPJ pendente · feito em São Paulo, Brasil
          </div>
          <div className="flex gap-4 text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-success" /> Status: operacional
            </span>
            <span>v0.9.0 · Sprint 9</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <a href={href} className="hover:text-white transition-colors">
        {children}
      </a>
    </li>
  );
}

function SocialLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-primary hover:text-white text-gray-400 flex items-center justify-center transition-colors"
    >
      {children}
    </a>
  );
}
