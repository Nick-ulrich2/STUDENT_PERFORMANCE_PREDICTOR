import { SectionIntro } from '@/components/ui/SectionIntro';
import { Reveal } from '@/components/ui/Reveal';

const cards = [
  [
    'Habitudes d’apprentissage',
    'Une vue simple des routines qui façonnent votre apprentissage, du temps d’étude à la régularité.',
    '↗',
  ],
  [
    'Estimation de performance',
    'Un signal basé sur vos données pour vous aider à faire le point aujourd’hui.',
    '◌',
  ],
  [
    'Analyses personnelles',
    'Des observations claires qui relient vos habitudes à des pistes concrètes.',
    '✦',
  ],
];

export function ProductPreviewSection() {
  return (
    <section id="product" className="bg-sky/55 section-pad">
      <div className="container">
        <SectionIntro
          eyebrow="À l’intérieur de SPP"
          title="Tout ce qu’il faut pour analyser votre progression"
        />
        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {cards.map((c, i) => (
            <Reveal key={c[0]} delay={i * 100}>
              <article className="card-hover group rounded-3xl border border-line bg-white p-7">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-mint text-xl text-teal">
                  {c[2]}
                </div>
                <h3 className="mt-8 text-xl font-extrabold text-navy">{c[0]}</h3>
                <p className="mt-3 leading-7 text-ink/60">{c[1]}</p>
                <div className="decorative-rule mt-7 h-1 rounded-full bg-teal/30" />
              </article>
            </Reveal>
          ))}
        </div>
        <p className="mt-8 text-center text-sm text-ink/55">
          Les estimations sont des indicateurs, pas des garanties. La
          performance académique dépend de nombreux facteurs.
        </p>
      </div>
    </section>
  );
}
