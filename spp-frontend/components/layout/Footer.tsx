import Link from 'next/link';
import { LogoMark } from '@/components/ui/Logo';

export function Footer() {
  return (
    <footer className="foot">
      <div className="wrap cols">
        <div>
          <Link className="logo" href="/" style={{ marginBottom: '.8rem' }}>
            <LogoMark />
            <span>SPP</span>
          </Link>
          <p style={{ maxWidth: '26rem' }}>
            Student Performance Predictor. Projet académique réalisé par Ulrich Mvongo. L’estimation fournie est indicative.
          </p>
        </div>
        <div>
          <b>Produit</b>
          <p>
            <Link href="/#how">Comment ça marche</Link>
            <br />
            <Link href="/#faq">FAQ</Link>
            <br />
            <Link href="/login">Connexion</Link>
          </p>
        </div>
        <div>
          <b>Technique</b>
          <p>
            Next.js · FastAPI
            <br />
            Supabase · Groq
            <br />
            Hébergé sur Vercel et Render
          </p>
        </div>
      </div>
    </footer>
  );
}
