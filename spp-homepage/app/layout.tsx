import type { Metadata } from 'next'; import { Manrope, DM_Serif_Display } from 'next/font/google'; import './globals.css';
const manrope=Manrope({subsets:['latin'],variable:'--font-manrope'}); const dm=DM_Serif_Display({subsets:['latin'],weight:'400',variable:'--font-dm-serif'});
export const metadata:Metadata={title:'SPP — Student Performance Predictor',description:'Understand your learning habits and move forward with clarity.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body className={`${manrope.variable} ${dm.variable}`}>{children}</body></html>}
