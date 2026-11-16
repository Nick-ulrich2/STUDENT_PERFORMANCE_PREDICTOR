'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogoMark } from '@/components/ui/Logo';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/Toast';
import { useI18n } from '@/lib/i18n';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { firstNameFromEmail } from '@/lib/format';
import { NAV, PUBLIC_LINKS, homeFor, isActive } from '@/components/layout/nav';

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();
  const { t, locale } = useI18n();
  const { user, loading, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    router.replace('/');
    toast(t('Vous êtes déconnecté·e. Votre jeton est effacé.'));
  };

  const name = user ? firstNameFromEmail(user.email, locale) : '';
  const links = user ? NAV[user.role] : null;

  return (
    <header className={`top${scrolled ? ' scrolled' : ''}`}>
      <div className="wrap">
        <Link className="logo" href={user ? homeFor(user.role) : '/'} aria-label={t('SPP, accueil')}>
          <LogoMark />
          <span>
            SPP<small>Student Performance Predictor</small>
          </span>
        </Link>

        {!loading && (
          <nav className="nav" aria-label={t('Navigation principale')}>
            {links
              ? links.map((l) => (
                  <Link key={l.href} href={l.href} aria-current={isActive(pathname, l.href) ? 'page' : undefined}>
                    {t(l.label)}
                  </Link>
                ))
              : PUBLIC_LINKS.map((l) => (
                  <Link key={l.href} href={l.href}>
                    {t(l.label)}
                  </Link>
                ))}
          </nav>
        )}

        <span className="sp" />

        <LanguageSwitcher />

        {!loading && !user && (
          <>
            <Link className="btn ghost sm hide-m" href="/login">
              {t('Se connecter')}
            </Link>
            <Link className="btn sm" href="/register">
              {t('Créer un compte')}
            </Link>
          </>
        )}

        {!loading && user && (
          <div ref={menuRef} style={{ position: 'relative' }}>
            <button
              type="button"
              className="chip-user"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((o) => !o)}
            >
              <span className={`avatar ${user.role}`}>{name.charAt(0)}</span>
              <span className="nm">{name}</span>
              <span className={`role-tag ${user.role}`}>{user.role === 'admin' ? t('admin') : t('étudiant')}</span>
            </button>
            {menuOpen && (
              <div className="pop" role="menu">
                <div className="tiny muted" style={{ padding: '.4rem .8rem' }}>
                  {user.email}
                </div>
                <button type="button" role="menuitem" onClick={handleLogout}>
                  {t('Se déconnecter')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
