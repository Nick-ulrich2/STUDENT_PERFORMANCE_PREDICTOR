import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { SectionIntro } from '@/components/ui/SectionIntro';
import { Reveal } from '@/components/ui/Reveal';

export default function HomePage() {
  return (
    <AppShell>
      <section className="container section-pad">
        <Reveal>
          <div className="max-w-2xl">
            <div className="eyebrow mb-4">Student Performance Predictor</div>
            <h1 className="font-display text-5xl leading-[1.05] tracking-[-.025em] text-navy md:text-6xl">
              Comprenez vos habitudes d’apprentissage.
            </h1>
            <p className="mt-5 text-lg leading-8 text-ink/65">
              Un outil clair pour estimer votre prochaine performance scolaire et
              identifier les leviers qui comptent le plus.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button href="/register">Créer un compte</Button>
              <Button href="/login" secondary>Se connecter</Button>
            </div>
          </div>
        </Reveal>
      </section>

      <section className="container section-pad">
        <SectionIntro
          eyebrow="Trois étapes"
          title="Du formulaire à la prédiction"
          description="Saisissez vos indicateurs clés, lancez la prédiction, et explorez votre historique."
        />
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            { title: '1. Saisir', body: 'Renseignez votre assiduité, vos heures d’étude, et vos scores.' },
            { title: '2. Prédire', body: 'Le modèle calcule un score prédit et identifie les leviers clés.' },
            { title: '3. Suivre', body: 'Vos prédictions sont sauvegardées et consultables à tout moment.' },
          ].map((step) => (
            <Reveal key={step.title}>
              <div className="card card-hover">
                <div className="eyebrow">{step.title}</div>
                <p className="mt-2 text-ink/75">{step.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <div className="mt-10">
          <Link href="/student-dashboard" className="text-sm font-bold text-navy underline-offset-4 hover:underline">
            Accéder au tableau de bord →
          </Link>
        </div>
      </section>
    </AppShell>
  );
}
