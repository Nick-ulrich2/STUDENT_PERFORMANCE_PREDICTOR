'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Spinner } from '@/components/ui/Spinner';
import type { UserRole } from '@/types/auth';

type ProtectedRouteProps = {
  children: React.ReactNode;
  role?: UserRole;
  redirectTo?: string;
};

export function ProtectedRoute({
  children,
  role,
  redirectTo = '/login',
}: ProtectedRouteProps) {
  const router = useRouter();
  const { user, loading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      router.replace(redirectTo);
      return;
    }
    if (role && user && user.role !== role) {
      router.replace(user.role === 'admin' ? '/admin-dashboard' : '/student-dashboard');
    }
  }, [loading, isAuthenticated, role, user, router, redirectTo]);

  if (loading) {
    return (
      <main className="container section-pad flex justify-center">
        <Spinner label="Chargement de votre session…" />
      </main>
    );
  }

  if (!isAuthenticated || (role && user?.role !== role)) {
    return null;
  }

  return <>{children}</>;
}
