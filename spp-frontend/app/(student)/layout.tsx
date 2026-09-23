import type { Metadata } from 'next';
import { NOINDEX_ROBOTS } from '@/lib/seo';

export const metadata: Metadata = { robots: NOINDEX_ROBOTS };

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
