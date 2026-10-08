import { Header } from '@/components/layout/Header';
import { NotFoundScreen } from '@/components/system/ErrorScreen';

export default function NotFound() {
  return (
    <>
      <Header />
      <main id="main">
        <NotFoundScreen />
      </main>
    </>
  );
}
