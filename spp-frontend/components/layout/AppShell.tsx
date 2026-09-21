import { Navbar } from '@/components/layout/Navbar';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="pt-[96px]">{children}</main>
    </>
  );
}
