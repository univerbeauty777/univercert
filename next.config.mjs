// UniverCert · Next.js config (Cloudflare Pages compatible)
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.r2.cloudflarestorage.com' },
      { protocol: 'https', hostname: '**.univercert.com.br' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' }, // google avatars
    ],
  },
};

// Cloudflare Pages dev binding (D1, R2, KV) — só em dev
if (process.env.NODE_ENV === 'development') {
  await import('@cloudflare/next-on-pages/next-dev').then((m) => m.setupDevPlatform());
}

export default nextConfig;
