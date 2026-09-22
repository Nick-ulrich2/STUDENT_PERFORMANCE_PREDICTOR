import { Button } from '@/components/ui/Button';

export function HeroSection() {
  return (
    <section className="soft-grid overflow-hidden border-b border-line pt-36 pb-24 md:pt-44 md:pb-32">
      <div className="container grid items-center gap-14 md:grid-cols-[1.03fr_.97fr]">
        <div className="reveal">
          <div className="eyebrow mb-5">Student Performance Predictor</div>
          <h1 className="max-w-3xl font-display text-5xl leading-[1.02] tracking-[-.035em] text-navy md:text-7xl">
            Comprenez vos habitudes d’apprentissage.{' '}
            <span className="text-teal">Avancez avec clarté.</span>
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-ink/65">
            Student Performance Predictor vous aide à suivre les habitudes qui
            façonnent votre apprentissage, à comprendre votre progression et à
            recevoir une estimation de performance basée sur vos données.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button href="#start">
              Commencer le suivi <span className="ml-2">↗</span>
            </Button>
            <Button href="#how-it-works" secondary>
              Voir comment ça marche
            </Button>
          </div>
          <p className="mt-5 text-xs font-bold tracking-wide text-ink/45">
            Vos données sont personnelles. Votre progression vous appartient.
          </p>
        </div>
        <div className="reveal delay-1 relative">
          <div className="absolute -right-20 -top-16 h-52 w-52 rounded-full bg-mint/70 blur-3xl" />
          <div className="relative rounded-[28px] border border-line bg-white p-5 shadow-[0_24px_70px_rgba(18,61,89,.12)] md:p-7">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.14em] text-teal">
                  Aperçu · Cette semaine
                </p>
                <h3 className="mt-2 text-xl font-extrabold text-navy">
                  Votre aperçu d’apprentissage
                </h3>
              </div>
              <span className="rounded-full bg-mint px-3 py-1 text-xs font-extrabold text-teal">
                Sur la bonne voie
              </span>
            </div>
            <div className="mt-8 rounded-2xl bg-cream p-4">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs font-bold text-ink/45">
                    Performance attendue
                  </p>
                  <p className="mt-1 text-4xl font-extrabold tracking-tight text-navy">
                    78<span className="text-xl text-ink/35">/100</span>
                  </p>
                </div>
                <p className="rounded-full bg-white px-2 py-1 text-xs font-bold text-teal">
                  +8.4%
                </p>
              </div>
              <svg
                className="mt-5 h-28 w-full"
                viewBox="0 0 420 110"
                fill="none"
                role="img"
                aria-label="Tendance d’apprentissage à la hausse"
              >
                <path
                  d="M0 91C38 83 49 89 78 72C112 51 121 70 157 62C193 54 199 42 231 52C268 64 276 46 310 35C348 23 366 27 420 10"
                  stroke="#2D7770"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <path
                  d="M0 91C38 83 49 89 78 72C112 51 121 70 157 62C193 54 199 42 231 52C268 64 276 46 310 35C348 23 366 27 420 10V110H0Z"
                  fill="#D7EEE4"
                  fillOpacity=".55"
                />
                <circle cx="310" cy="35" r="6" fill="white" stroke="#2D7770" strokeWidth="3" />
                <circle cx="420" cy="10" r="6" fill="#2D7770" />
              </svg>
            </div>
            <div className="mt-5 flex gap-3">
              <div className="flex-1 rounded-xl border border-line p-3">
                <p className="text-xs text-ink/45">Rythme d’étude</p>
                <p className="mt-1 font-extrabold text-navy">Régulier</p>
              </div>
              <div className="flex-1 rounded-xl border border-line p-3">
                <p className="text-xs text-ink/45">Séances de concentration</p>
                <p className="mt-1 font-extrabold text-navy">12 cette semaine</p>
              </div>
            </div>
            <p className="mt-5 text-sm leading-6 text-ink/60">
              <span className="font-bold text-teal">Bon signal.</span> Des
              habitudes d’étude régulières sont associées à une meilleure
              performance attendue.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
