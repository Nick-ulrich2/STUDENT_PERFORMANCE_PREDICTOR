'use client';

import type { CSSProperties, ElementType, ReactNode } from 'react';
import { useInView } from '@/hooks/useInView';

type InViewProps = {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  threshold?: number;
  [attribute: string]: unknown;
};

// Adds the `in` class once the element has entered the viewport, for CSS-driven
// entrance effects (highlighter sweep, reveal).
export function InView({ children, as: Tag = 'div', className = '', style, threshold = 0.2, ...rest }: InViewProps) {
  const [ref, inView] = useInView<HTMLElement>(threshold);
  return (
    <Tag ref={ref} className={`${className}${inView ? ' in' : ''}`.trim()} style={style} {...rest}>
      {children}
    </Tag>
  );
}

type RevealProps = {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  delay?: number;
  [attribute: string]: unknown;
};

export function Reveal({ delay = 0, className = '', style, children, ...rest }: RevealProps) {
  return (
    <InView {...rest} className={`rv ${className}`.trim()} style={{ '--d': `${delay}s`, ...style } as CSSProperties}>
      {children}
    </InView>
  );
}

// The yellow highlighter sweep behind a key phrase, played when it scrolls into view.
export function Highlight({ children }: { children: ReactNode }) {
  return (
    <InView as="span" className="hl" threshold={0.6}>
      {children}
    </InView>
  );
}
