import { SectionIntro } from '@/components/ui/SectionIntro';

const items = [
  [
    'Confidentialité par conception',
    'Vos informations vous appartiennent. SPP est conçu pour garder vos données d’apprentissage personnelles ciblées et protégées.',
  ],
  [
    'Explications claires',
    'Pas de boîte noire. Nous expliquons ce que signifie une estimation — et ce qu’elle ne signifie pas.',
  ],
  [
    'Pas de fausse certitude',
    'L’apprentissage est complexe. Nous présentons des signaux avec humilité, contexte et place pour le changement.',
  ],
];

export function TrustSection() {
  return (
    <section id="privacy" className="section-pad">
      <div className="container">
        <div className="grid gap-12 md:grid-cols-[.8fr_1.2fr] md:items-end">
          <SectionIntro
            eyebrow="Confiance & confidentialité"
            title="Conçu pour accompagner les étudiants, pas les juger"
          />
          <p className="max-w-md text-lg leading-8 text-ink/60">
            Votre parcours d’apprentissage est plus qu’un chiffre. SPP vous
            offre un moyen privé et compréhensible de repérer des tendances,
            de poser de meilleures questions et de faire des choix éclairés —
            sans transformer l’incertitude en verdict.
          </p>
        </div>
        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {items.map((x, i) => (
            <article key={x[0]} className="border-t-2 border-teal/40 pt-5">
              <span className="text-sm font-bold text-teal">0{i + 1}</span>
              <h3 className="mt-8 text-lg font-extrabold text-navy">{x[0]}</h3>
              <p className="mt-3 leading-7 text-ink/60">{x[1]}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
