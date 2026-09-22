import Link from 'next/link';
import { navigation } from '@/data/navigation';
import { Button } from '@/components/ui/Button';

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-line/80 bg-cream/80 backdrop-blur">
      <div className="container flex h-[76px] items-center justify-between gap-4">
        <Link href="#top" className="flex items-center gap-2 font-extrabold tracking-[-.04em] text-ink">
          <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-navy text-sm text-white">S</span>
          <span>
            SPP<span className="text-teal">.</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-semibold text-ink/70 transition-colors hover:text-navy"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/login" className="px-3 py-3 text-sm font-bold text-navy">
            Sign in
          </Link>
          <Button href="/register">Get started</Button>
        </div>
      </div>
    </header>
  );
}
