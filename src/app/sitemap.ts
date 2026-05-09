import type { MetadataRoute } from 'next';

export const runtime = 'edge';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://univercert.com.br';
  const now = new Date();

  return [
    { url: `${base}/`, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${base}/demo`, lastModified: now, changeFrequency: 'weekly', priority: 0.95 },
    { url: `${base}/roi`, lastModified: now, changeFrequency: 'monthly', priority: 0.85 },
    { url: `${base}/vs/certifier`, lastModified: now, changeFrequency: 'monthly', priority: 0.85 },
    { url: `${base}/vs/sertifier`, lastModified: now, changeFrequency: 'monthly', priority: 0.85 },
    { url: `${base}/vs/canva`, lastModified: now, changeFrequency: 'monthly', priority: 0.85 },
    { url: `${base}/casos`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/casos/cabelo`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/casos/estetica`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/casos/barbearia`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/casos/idiomas`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/casos/mba`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/casos/online`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/sign-up`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/sign-in`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/uh/solicitar`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${base}/reseller`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/termos`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/privacidade`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/lgpd`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];
}
