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
    'Understand your learning habits and predict your academic performance with clarity.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${manrope.variable} ${dmSerif.variable}`}>
        {children}
      </body>
    </html>
  );
}
