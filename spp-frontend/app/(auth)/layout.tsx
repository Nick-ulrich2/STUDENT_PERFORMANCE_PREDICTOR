import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { GuestOnly } from '@/components/auth/Guard';
import { NOINDEX_ROBOTS } from '@/lib/seo';

export const metadata: Metadata = { robots: NOINDEX_ROBOTS };

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <Suspense fallback={null}>
        <GuestOnly>{children}</GuestOnly>
      </Suspense>
    </AppShell>
  );
}
