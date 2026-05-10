// UniverCert · Next.js config (Cloudflare Pages compatible)
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Sprint 0: deploy first, types later. Sprint 1+ remove ambos.
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },

  experimental: {
    typedRoutes: false,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.r2.cloudflarestorage.com' },
      { protocol: 'https', hostname: '**.univercert.net' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
};

if (process.env.NODE_ENV === 'development') {
  await import('@cloudflare/next-on-pages/next-dev').then((m) => m.setupDevPlatform());
}

export default nextConfig;
