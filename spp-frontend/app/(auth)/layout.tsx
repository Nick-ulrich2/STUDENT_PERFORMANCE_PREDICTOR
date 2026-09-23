import type { Metadata } from 'next';
import { NOINDEX_ROBOTS } from '@/lib/seo';

// Login/register add no unique content for search and would otherwise show
// up as bare "sign in" pages in results — noindex, same as the app itself.
export const metadata: Metadata = { robots: NOINDEX_ROBOTS };

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
