import type { Metadata } from 'next';
import { Manrope, DM_Serif_Display } from 'next/font/google';
import './globals.css';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
});

const dmSerif = DM_Serif_Display({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-dm-serif',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'SPP — Student Performance Predictor',
  description:
    'Comprenez vos habitudes d\'apprentissage et anticipez votre performance académique en toute clarté.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={`${manrope.variable} ${dmSerif.variable}`}>
        {children}
      </body>
    </html>
  );
}
