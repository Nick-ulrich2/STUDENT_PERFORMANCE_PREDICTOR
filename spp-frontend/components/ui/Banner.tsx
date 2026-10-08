import type { ReactNode } from 'react';
import { AlertTriangle, Check, Info, Lock } from 'lucide-react';

type BannerTone = 'info' | 'warn' | 'risk' | 'ok';

const ICONS = { info: Info, warn: AlertTriangle, risk: AlertTriangle, ok: Check };

type BannerProps = {
  tone: BannerTone;
  title?: string;
  children?: ReactNode;
  action?: ReactNode;
  lock?: boolean;
  className?: string;
};

export function Banner({ tone, title, children, action, lock, className = '' }: BannerProps) {
  const Icon = lock ? Lock : ICONS[tone];
  return (
    <div className={`banner ${tone} ${className}`.trim()} role={tone === 'risk' || tone === 'warn' ? 'alert' : 'status'}>
      <span className="ic">
        <Icon size={20} strokeWidth={1.8} aria-hidden="true" />
      </span>
      <div>
        {title && <b>{title}</b>}
        {children}
      </div>
      {action}
    </div>
  );
}
