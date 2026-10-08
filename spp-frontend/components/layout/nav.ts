import { Clock, History, LayoutGrid, List, Target, User, Users, type LucideIcon } from 'lucide-react';
import type { UserRole } from '@/types/auth';

export type NavItem = { href: string; label: string; icon: LucideIcon };

export const NAV: Record<UserRole, NavItem[]> = {
  student: [
    { href: '/student-dashboard', label: 'Tableau de bord', icon: LayoutGrid },
    { href: '/tracking', label: 'Suivi', icon: Clock },
    { href: '/predict', label: 'Prédire', icon: Target },
    { href: '/history', label: 'Historique', icon: History },
  ],
  admin: [
    { href: '/admin-dashboard', label: 'Vue d’ensemble', icon: LayoutGrid },
    { href: '/predictions', label: 'Prédictions', icon: List },
    { href: '/admin/users', label: 'Utilisateurs', icon: Users },
    { href: '/student-dashboard', label: 'Mon espace', icon: User },
  ],
};

export const PUBLIC_LINKS = [
  { href: '/#how', label: 'Comment ça marche' },
  { href: '/#principle', label: 'Le principe' },
  { href: '/#faq', label: 'FAQ' },
];

export function isActive(pathname: string, href: string): boolean {
  if (href === '/predict') return pathname === '/predict' || pathname.startsWith('/predict/');
  return pathname === href;
}

export function homeFor(role: UserRole): string {
  return role === 'admin' ? '/admin-dashboard' : '/student-dashboard';
}
