import { Button } from '@/components/ui/Button';

const footerLinks = [
  { label: 'Produit', href: '#product' },
  { label: 'Comment ça marche', href: '#how-it-works' },
  { label: 'Confidentialité', href: '#privacy' },
  { label: 'Conditions', href: '#top' },
  { label: 'Contact', href: '#top' },
  { label: 'Connexion', href: '#top' },
];

export function FinalCTASection() {
  return (
    <>
      <section id="start" className="bg-navy py-24 text-center text-white md:py-32">
        <div className="container">
          <div className="eyebrow text-[#9dd8c8]">Votre prochaine étape</div>
          <h2 className="mx-auto mt-5 max-w-2xl font-display text-5xl leading-[1.05] tracking-[-.025em] md:text-6xl">
            Commencez avec une vision plus claire de votre routine
            d’apprentissage
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-lg leading-8 text-white/65">
            De petites observations peuvent vous aider à prendre des décisions
            plus éclairées au fil du temps.
          </p>
          <div className="mt-8">
            <Button href="#top">
              Créer votre compte <span className="ml-2">↗</span>
            </Button>
          </div>
        </div>
      </section>
      <footer className="bg-[#0d2f44] py-10 text-white">
        <div className="container flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div>
            <a href="#top" className="text-xl font-extrabold tracking-[-.04em]">
              SPP<span className="text-[#9dd8c8]">.</span>
            </a>
            <p className="mt-3 max-w-sm text-sm leading-6 text-white/50">
              SPP est un outil d’accompagnement pédagogique. Ce n’est ni un
              système de diagnostic ni une garantie de réussite académique.
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-5 gap-y-3 text-sm font-semibold text-white/65">
            {footerLinks.map((link) => (
              <a key={link.label} href={link.href} className="hover:text-white">
                {link.label}
              </a>
            ))}
          </nav>
        </div>
      </footer>
    </>
  );
}
