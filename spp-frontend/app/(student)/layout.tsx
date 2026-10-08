import type { Metadata } from 'next';
import { AppShell } from '@/components/layout/AppShell';
import { Guard } from '@/components/auth/Guard';
import { NOINDEX_ROBOTS } from '@/lib/seo';

export const metadata: Metadata = { robots: NOINDEX_ROBOTS };

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <Guard allow="user">{children}</Guard>
    </AppShell>
  );
}
