'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { NAV, isActive } from '@/components/layout/nav';

const MOBILE_LABELS: Record<string, string> = { '/admin-dashboard': 'Vue' };

export function TabBar() {
  const pathname = usePathname();
  const { user } = useAuth();
  if (!user) return null;
  const items = NAV[user.role].slice(0, user.role === 'admin' ? 3 : 4);
  return (
    <nav className="tabbar" aria-label="Navigation mobile">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Link key={item.href} href={item.href} aria-current={isActive(pathname, item.href) ? 'page' : undefined}>
            <Icon size={22} strokeWidth={1.8} aria-hidden="true" />
            {MOBILE_LABELS[item.href] ?? item.label}
          </Link>
        );
      })}
    </nav>
  );
}
