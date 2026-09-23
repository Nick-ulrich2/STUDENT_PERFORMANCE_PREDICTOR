import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

// Only the public marketing homepage has content worth indexing — every
// other route is private, per-user data behind auth (see robots.ts and the
// per-route-group noindex layouts).
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
  ];
}
