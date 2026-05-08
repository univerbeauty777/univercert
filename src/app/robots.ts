import type { MetadataRoute } from 'next';

export const runtime = 'edge';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/dashboard', '/queue', '/credentials', '/recipients', '/bulk', '/audit', '/billing', '/domain', '/templates', '/integrations', '/reseller'],
      },
    ],
    sitemap: 'https://univercert.com.br/sitemap.xml',
    host: 'https://univercert.com.br',
  };
}
