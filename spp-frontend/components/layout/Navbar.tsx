'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { navigation } from '@/data/navigation';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';

const STUDENT_LINKS = [
  { label: 'Tableau de bord', href: '/student-dashboard' },
  { label: 'Prédire', href: '/predict' },
  { label: 'Historique', href: '/history' },
];

const ADMIN_LINKS = [
  { label: 'Tableau de bord', href: '/admin-dashboard' },
  { label: 'Prédictions', href: '/predictions' },
  { label: 'Utilisateurs', href: '/admin/users' },
];

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const appLinks = user?.role === 'admin' ? ADMIN_LINKS : STUDENT_LINKS;
  const logoHref = user ? (user.role === 'admin' ? '/admin-dashboard' : '/student-dashboard') : '/';

  return (
    <header className="sticky top-0 z-50 border-b border-line/80 bg-cream/80 backdrop-blur">
      <div className="container flex h-[76px] items-center justify-between gap-4">
        <Link href={logoHref} className="flex items-center gap-2 font-extrabold tracking-[-.04em] text-ink">
          <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-navy text-sm text-white">S</span>
          <span>
            SPP<span className="text-teal">.</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {(user ? appLinks : navigation).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm font-semibold transition-colors hover:text-navy ${
                pathname === item.href ? 'text-navy' : 'text-ink/70'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {!loading && user ? (
          <div className="flex items-center gap-3">
            <span className="hidden text-sm font-semibold text-ink/70 sm:inline">
              {user.email} · {user.role === 'admin' ? 'Admin' : 'Étudiant'}
            </span>
            <Button onClick={handleLogout}>Se déconnecter</Button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link href="/login" className="px-3 py-3 text-sm font-bold text-navy">
              Connexion
            </Link>
            <Button href="/register">Créer un compte</Button>
          </div>
        )}
      </div>
    </header>
  );
}
