// UniverCert · legal pages shell

import Footer from '@/components/Footer';

export const runtime = 'edge';

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <nav className="sticky top-0 z-50 bg-white/85 backdrop-blur border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold shadow-md shadow-primary/30">
              🏆
            </div>
            <span className="font-extrabold text-lg">
              Univer<span className="text-primary">Cert</span>
            </span>
          </a>
          <a href="/" className="text-sm text-gray-600 hover:text-primary">← Voltar</a>
        </div>
      </nav>
      <main className="max-w-3xl mx-auto px-6 py-14">
        <article className="prose prose-gray max-w-none [&>h1]:text-3xl [&>h1]:font-extrabold [&>h1]:tracking-tight [&>h1]:mb-3 [&>h2]:text-xl [&>h2]:font-bold [&>h2]:mt-10 [&>h2]:mb-3 [&>p]:text-sm [&>p]:text-gray-700 [&>p]:leading-relaxed [&>p]:mb-3 [&>ul]:text-sm [&>ul]:text-gray-700 [&>ul]:list-disc [&>ul]:ml-5 [&>ul]:space-y-1.5 [&>ul]:mb-4">
          {children}
        </article>
      </main>
      <Footer />
    </>
  );
}
