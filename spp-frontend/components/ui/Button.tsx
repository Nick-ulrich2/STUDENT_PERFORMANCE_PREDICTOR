import React from 'react';

type ButtonProps = {
  children: React.ReactNode;
  href?: string;
  type?: 'button' | 'submit' | 'reset';
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  secondary?: boolean;
  fullWidth?: boolean;
  className?: string;
  ariaLabel?: string;
};

export function Button({
  children,
  href,
  type = 'button',
  onClick,
  disabled = false,
  secondary = false,
  fullWidth = false,
  className = '',
  ariaLabel,
}: ButtonProps) {
  const base =
    'inline-flex min-h-[48px] items-center justify-center rounded-full px-5 text-sm font-bold';
  const variants = secondary
    ? 'border border-line bg-white/60 text-navy hover:-translate-y-0.5 hover:border-navy'
    : 'bg-navy text-white shadow-[0_8px_22px_rgba(18,61,89,.16)] hover:-translate-y-0.5 hover:bg-[#0d3149] hover:shadow-[0_10px_26px_rgba(18,61,89,.22)]';
  const state = disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : '';
  const width = fullWidth ? 'w-full' : '';
  const cls = `${base} ${variants} ${state} ${width} ${className}`.trim();

  if (href) {
    return (
      <a className={cls} href={href} aria-label={ariaLabel}>
        {children}
      </a>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cls}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}