import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Every private, per-user page also sets its own noindex meta tag
        // (see the (student)/(admin)/(auth) layouts) — disallowing the
        // paths here too keeps crawlers from even fetching them.
        disallow: [
          '/student-dashboard',
          '/admin-dashboard',
          '/predict',
          '/history',
          '/predictions',
          '/admin/',
          '/login',
          '/register',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
