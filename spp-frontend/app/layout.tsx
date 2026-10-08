import type { Metadata, Viewport } from 'next';
import { Caveat, Fraunces, Instrument_Sans, JetBrains_Mono } from 'next/font/google';
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/seo';
import { AuthProvider } from '@/hooks/useAuth';
import { ToastProvider } from '@/components/ui/Toast';
import { ColdStartOverlay } from '@/components/system/ColdStartOverlay';
import './globals.css';

const fraunces = Fraunces({
  subsets: ['latin'],
  axes: ['SOFT', 'opsz'],
  variable: '--font-fraunces',
  display: 'swap',
});

const instrument = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-instrument',
  display: 'swap',
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-jetbrains',
  display: 'swap',
});

const caveat = Caveat({
  subsets: ['latin'],
  weight: ['700'],
  variable: '--font-caveat',
  display: 'swap',
});

export const viewport: Viewport = {
  themeColor: '#F5EFE3',
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: '%s · SPP',
  },
  description: SITE_DESCRIPTION,
  keywords: [
    'prédiction performance scolaire',
    'suivi habitudes étudiants',
    'machine learning éducation',
    'tracker académique',
    'assiduité étudiant',
    'student performance predictor',
    'estimation note examen',
  ],
  authors: [{ name: 'Ulrich Mvongo' }],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${fraunces.variable} ${instrument.variable} ${jetbrains.variable} ${caveat.variable}`}>
      <body>
        <noscript>
          <style>{'.rv{opacity:1!important;transform:none!important}.hl{background-size:100% 100%!important}.heat i{opacity:1!important}'}</style>
        </noscript>
        <a className="skip" href="#main">
          Aller au contenu
        </a>
        <AuthProvider>
          <ToastProvider>
            <div className="app">{children}</div>
            <ColdStartOverlay />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
