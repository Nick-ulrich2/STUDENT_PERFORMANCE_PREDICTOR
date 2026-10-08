import type { Metadata } from 'next';
import { AppShell } from '@/components/layout/AppShell';
import { NOINDEX_ROBOTS } from '@/lib/seo';

export const metadata: Metadata = { robots: NOINDEX_ROBOTS };

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
