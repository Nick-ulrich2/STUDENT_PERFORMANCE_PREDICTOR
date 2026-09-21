'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';

const STUDENT_LINKS = [
  { href: '/student-dashboard', label: 'Dashboard' },
  { href: '/predict', label: 'Prédire' },
  { href: '/history', label: 'Historique' },
];

const ADMIN_LINKS = [
  { href: '/admin-dashboard', label: 'Dashboard' },
  { href: '/admin/predictions', label: 'Prédictions' },
];

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const pathname = usePathname();
  const links = user?.role === 'admin' ? ADMIN_LINKS : STUDENT_LINKS;

  return (
    <header className="fixed inset-x-0 top-0 z-30 border-b border-line/60 bg-cream/80 backdrop-blur">
      <div className="container flex h-[76px] items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 font-extrabold tracking-[-.04em] text-ink">
          <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-navy text-sm text-white">S</span>
          <span>SPP<span className="text-teal">.</span></span>
        </Link>

        {isAuthenticated && (
          <nav className="hidden items-center gap-6 md:flex">
            {links.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-semibold transition-colors ${
                    active ? 'text-navy' : 'text-ink/70 hover:text-navy'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        )}

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <span className="hidden text-xs font-semibold text-ink/60 md:inline">
                {user?.email}
              </span>
              <Button onClick={logout} secondary>
                Se déconnecter
              </Button>
            </>
          ) : (
            <>
              <Link href="/login" className="px-3 py-3 text-sm font-bold text-navy">
                Connexion
              </Link>
              <Button href="/register">Inscription</Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
