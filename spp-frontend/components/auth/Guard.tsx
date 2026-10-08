'use client';

import { useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { ForbiddenScreen } from '@/components/system/ErrorScreen';
import { homeFor } from '@/components/layout/nav';
import type { UserRole } from '@/types/auth';

type GuardProps = {
  children: React.ReactNode;
  // 'user' = any signed-in account (an admin is a superset of a student);
  // 'admin' = administrators only, anyone else gets the 403 screen.
  allow: 'user' | UserRole;
};

export function Guard({ children, allow }: GuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, isLoggingOut } = useAuth();

  useEffect(() => {
    if (loading || user || isLoggingOut()) return;
    router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [loading, user, router, pathname, isLoggingOut]);

  if (loading || !user) {
    return (
      <div className="loading-screen" role="status" aria-live="polite">
        <div className="spin" aria-hidden="true" />
        <p>Chargement de votre session…</p>
      </div>
    );
  }

  if (allow === 'admin' && user.role !== 'admin') {
    return <ForbiddenScreen homeHref={homeFor(user.role)} />;
  }

  return <>{children}</>;
}

// Only same-site paths are accepted as a post-login destination.
export function safeNext(value: string | null): string | null {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : null;
}

// Wraps the login / register pages: a signed-in visitor goes straight to the
// page they asked for (?next=) or to their own space.
export function GuestOnly({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const next = safeNext(searchParams.get('next'));

  useEffect(() => {
    if (user) router.replace(next ?? homeFor(user.role));
  }, [user, router, next]);

  if (loading || user) {
    return (
      <div className="loading-screen" role="status" aria-live="polite">
        <div className="spin" aria-hidden="true" />
        <p>Chargement…</p>
      </div>
    );
  }
  return <>{children}</>;
}
