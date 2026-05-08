// UniverCert · sign-in (Sprint 1 conecta Better Auth client)

export const runtime = 'edge';

export default function SignInPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-soft to-white px-4">
      <div className="card max-w-md w-full">
        <h1 className="text-2xl font-extrabold mb-2">Entrar</h1>
        <p className="text-sm text-gray-500 mb-6">UniverCert · sua plataforma de certificados</p>

        <form className="space-y-4">
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" name="email" type="email" className="input" required />
          </div>
          <div>
            <label className="label" htmlFor="password">Senha</label>
            <input id="password" name="password" type="password" className="input" required />
          </div>
          <button type="submit" className="btn-primary w-full justify-center">Entrar</button>
        </form>

        <div className="my-4 flex items-center gap-3 text-xs text-gray-400">
          <div className="flex-1 h-px bg-gray-200" /> ou <div className="flex-1 h-px bg-gray-200" />
        </div>

        <button className="btn-secondary w-full justify-center">
          Continuar com Google
        </button>

        <p className="text-xs text-center text-gray-400 mt-6">
          Sprint 1: ligar Better Auth client + handlers reais
        </p>
      </div>
    </main>
  );
}
