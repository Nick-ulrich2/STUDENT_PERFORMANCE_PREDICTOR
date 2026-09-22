import { SectionIntro } from '@/components/ui/SectionIntro';
import { Reveal } from '@/components/ui/Reveal';

const steps = [
  [
    '01',
    'Suivre',
    'Commencez avec de simples informations quotidiennes sur votre routine d’étude, votre assiduité, votre sommeil et votre concentration.',
  ],
  [
    '02',
    'Comprendre',
    'Observez des tendances dans le temps et recevez une estimation expliquée simplement.',
  ],
  [
    '03',
    'Avancer',
    'Transformez vos observations en petites décisions réalistes qui soutiennent votre prochaine étape.',
  ],
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="section-pad">
      <div className="container">
        <SectionIntro
          eyebrow="Comment ça marche"
          title="Une vision plus claire de votre façon d’apprendre"
          description="SPP transforme de simples informations quotidiennes en enseignements clairs et actionnables."
        />
        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {steps.map((s, i) => (
            <Reveal key={s[1]} delay={i * 100}>
              <article
                className={`card-hover rounded-3xl border border-line p-7 ${i === 1 ? 'bg-navy text-white' : 'bg-white'}`}
              >
                <span className={`font-bold ${i === 1 ? 'text-[#9dd8c8]' : 'text-teal'}`}>
                  {s[0]}
                </span>
                <h3 className={`mt-12 text-2xl font-extrabold ${i === 1 ? 'text-white' : 'text-navy'}`}>
                  {s[1]}
                </h3>
                <p className={`mt-3 leading-7 ${i === 1 ? 'text-white/65' : 'text-ink/60'}`}>
                  {s[2]}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
