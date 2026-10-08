import { Header } from '@/components/layout/Header';
import { TabBar } from '@/components/layout/TabBar';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main id="main" tabIndex={-1} style={{ outline: 'none' }}>
        <div className="view-enter">{children}</div>
      </main>
      <TabBar />
    </>
  );
}
