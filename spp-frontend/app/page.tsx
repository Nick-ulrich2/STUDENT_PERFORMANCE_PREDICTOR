import Link from 'next/link';
import { ArrowRight, Lock, Square } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { JsonLd } from '@/components/seo/JsonLd';
import { HeroDemo } from '@/components/landing/HeroDemo';
import { VizBars } from '@/components/landing/VizBars';
import { CountUp } from '@/components/ui/CountUp';
import { Heatmap, type HeatCell } from '@/components/ui/Heatmap';
import { InView, Reveal } from '@/components/ui/Reveal';
import { Spark } from '@/components/ui/Spark';
import { faqs } from '@/data/faqs';
import { previewScore } from '@/lib/model';

const TICKER_WORDS = ['Assiduité', 'Heures d’étude', 'Note précédente', 'Tutorat', 'Ressources', 'Implication parentale'];

// Illustration only: a fixed, plausible progression computed with the real model.
const SAMPLE_SCORES = [
  [63, 9, 62, 0, 'Low', 'Medium'],
  [70, 12, 64, 1, 'Medium', 'Medium'],
  [74, 14, 66, 1, 'Medium', 'Medium'],
  [78, 15, 68, 1, 'Medium', 'Medium'],
  [84, 18, 71, 1, 'Medium', 'Medium'],
  [82, 17, 71, 2, 'Medium', 'Medium'],
].map(([a, h, p, t, r, i]) =>
  previewScore({
    Attendance: a as number,
    Hours_Studied: h as number,
    Previous_Scores: p as number,
    Tutoring_Sessions: t as number,
    Access_to_Resources: r as 'Low' | 'Medium' | 'High',
    Parental_Involvement: i as 'Low' | 'Medium' | 'High',
  }),
);

const SAMPLE_HEAT: HeatCell[] = Array.from({ length: 126 }, (_, i) => {
  const x = ((i * 2654435761) >>> 0) / 4294967296;
  const weekend = i % 7 >= 5;
  const level = x < (weekend ? 0.55 : 0.2) ? 0 : x < 0.5 ? 1 : x < 0.75 ? 2 : x < 0.92 ? 3 : 4;
  return { key: `s${i}`, level };
});

const STEPS = [
  {
    n: '01',
    title: 'Mesurez',
    text: 'Lancez un chronomètre quand vous étudiez ou quand vous voyez votre tuteur. Marquez votre présence. SPP agrège tout sur 7 jours glissants.',
  },
  {
    n: '02',
    title: 'Prédisez',
    text: 'Six variables entrent dans un modèle linéaire. Il en sort une note estimée sur 100, avec la part de chaque variable dans le résultat.',
  },
  {
    n: '03',
    title: 'Agissez',
    text: 'Un conseil de 60 mots maximum, en français, tiré de vos variables sous les seuils. Une seule piste, jamais un diagnostic.',
  },
];

export default function Page() {
  return (
    <>
      <JsonLd />
      <Header />
      <main id="main" tabIndex={-1} style={{ outline: 'none' }}>
        <InView as="section" className="hero" threshold={0.05}>
          <div className="wrap">
            <div>
              <span className="eyebrow">Student Performance Predictor</span>
              <h1 className="display">
                Votre note de demain se prépare <span className="hl">aujourd’hui</span>.
              </h1>
              <p className="lead">
                SPP transforme vos habitudes d’étude en une estimation de note d’examen, puis vous dit sur quelle habitude agir en priorité. Sans jargon.
              </p>
              <div className="row ctas" style={{ ['--g' as string]: '.8rem' }}>
                <Link className="btn" href="/register">
                  Estimer ma note <ArrowRight className="ar" size={18} aria-hidden="true" />
                </Link>
                <Link className="btn ghost" href="/#how">
                  Voir comment ça marche
                </Link>
              </div>
              <div className="micro">
                <span>Gratuit</span>
                <span>Vos données restent les vôtres</span>
                <span>Une estimation, jamais un verdict</span>
              </div>
            </div>
            <Reveal delay={0.15}>
              <HeroDemo />
            </Reveal>
          </div>
        </InView>

        <div className="ticker" aria-hidden="true">
          <div>
            {[...TICKER_WORDS, ...TICKER_WORDS].map((w, i) => (
              <span key={i}>{w}</span>
            ))}
          </div>
        </div>

        <section className="sec" id="how">
          <div className="wrap">
            <Reveal className="sec-h">
              <span className="eyebrow">Comment ça marche</span>
              <h2 className="display">
                Trois gestes. <span className="hl">Une</span> action claire.
              </h2>
              <p className="lead">
                Vous étudiez, SPP mesure. Vous demandez une estimation, le modèle calcule. Vous lisez un conseil, vous agissez.
              </p>
            </Reveal>
            <div className="steps">
              {STEPS.map((s, i) => (
                <Reveal as="article" key={s.n} className="card step" delay={0.05 + i * 0.1}>
                  <div className="n">{s.n}</div>
                  <h3 className="display">{s.title}</h3>
                  <p>{s.text}</p>
                  {i === 0 && (
                    <div className="viz" aria-hidden="true">
                      <div className="row" style={{ ['--g' as string]: '.7rem' }}>
                        <span className="rec" />
                        <span className="clock" style={{ fontSize: '1.9rem' }}>
                          01:24:09
                        </span>
                      </div>
                    </div>
                  )}
                  {i === 1 && <VizBars />}
                  {i === 2 && (
                    <div className="viz" style={{ background: '#FFF8D6' }} aria-hidden="true">
                      <span className="hand" style={{ fontSize: '1.45rem', padding: '0 1.2rem', textAlign: 'center', lineHeight: 1.2, transform: 'rotate(-2deg)' }}>
                        « Réservez une séance de tutorat cette semaine. »
                      </span>
                    </div>
                  )}
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="sec" style={{ paddingTop: 0 }}>
          <div className="wrap">
            <div className="bento">
              <Reveal as="article" className="card b1">
                <span className="pill mark">Suivi continu</span>
                <h3 className="display" style={{ margin: '.8rem 0 .4rem' }}>Un chrono, pas un formulaire.</h3>
                <p className="muted">Vos habitudes se collectent pendant que vous étudiez, pas après coup de mémoire.</p>
                <div className="timer" style={{ marginTop: '1.2rem', background: 'var(--paper-2)', padding: '1rem 1.2rem', borderRadius: 'var(--r-md)' }} aria-hidden="true">
                  <div className="clock">00:47:21</div>
                  <div className="row" style={{ justifyContent: 'flex-end' }}>
                    <span className="btn sm" style={{ pointerEvents: 'none' }}>
                      <Square size={14} fill="currentColor" aria-hidden="true" /> Arrêter
                    </span>
                  </div>
                </div>
              </Reveal>
              <Reveal as="article" className="card b2" delay={0.1}>
                <span className="pill mark">Régularité</span>
                <h3 className="display" style={{ margin: '.8rem 0 .4rem' }}>Séries et carte de chaleur.</h3>
                <p className="muted">Un jour consécutif de plus, une case qui s’allume.</p>
                <div style={{ marginTop: '1.2rem' }}>
                  <Heatmap days={SAMPLE_HEAT} weeks={18} label="Exemple de carte de chaleur d’activité" />
                </div>
              </Reveal>
              <Reveal as="article" className="card b3">
                <span className="pill mark">Honnêteté</span>
                <h3 className="display" style={{ margin: '.8rem 0 .4rem' }}>± 2 points.</h3>
                <p className="muted">Chaque résultat affiche sa marge d’erreur typique. Une estimation n’est pas un verdict.</p>
              </Reveal>
              <Reveal as="article" className="card b4" delay={0.1}>
                <span className="pill mark">Progression</span>
                <h3 className="display" style={{ margin: '.8rem 0 .4rem' }}>Chaque estimation est gardée. Voyez la courbe monter.</h3>
                <Spark values={SAMPLE_SCORES} height={90} />
              </Reveal>
            </div>
          </div>
        </section>

        <section className="sec dark" id="principle">
          <div className="wrap">
            <Reveal className="sec-h" style={{ marginBottom: 0 }}>
              <span className="eyebrow">Le principe non négociable</span>
              <h2 className="display">
                Le ML <span className="hl" style={{ backgroundImage: 'linear-gradient(transparent 56%,#6b5600 56% 94%,transparent 94%)' }}>prédit</span>, l’IA explique.
              </h2>
              <p className="lead">
                Le calcul de votre note est fait par un modèle statistique que l’on peut lire et auditer. L’assistant IA ne sert qu’à mettre des mots sur le résultat.
              </p>
            </Reveal>
            <Reveal className="flow">
              <div className="node">
                <span className="pill ink" style={{ background: '#3a372f' }}>Entrée</span>
                <h3>Vos 6 habitudes</h3>
                <p>Assiduité, heures, note précédente, tutorat, ressources, implication parentale.</p>
              </div>
              <div className="arrow" aria-hidden="true">→</div>
              <div className="node hot">
                <span className="pill mark">Calcule seul</span>
                <h3>Modèle Ridge</h3>
                <p>Régression linéaire. Produit la note et le poids de chaque variable. Rien d’autre ne peut la modifier.</p>
              </div>
              <div className="arrow" aria-hidden="true">→</div>
              <div className="node">
                <span className="pill" style={{ background: '#3a372f', color: '#fff' }}>Explique</span>
                <h3>Assistant IA</h3>
                <p>Ne reçoit que le score et les variables sous les seuils. Écrit 60 mots en français.</p>
              </div>
            </Reveal>
            <div className="lock">
              <Lock size={18} aria-hidden="true" /> L’IA ne voit jamais vos données brutes et ne peut pas changer votre note.
            </div>
          </div>
        </section>

        <section className="sec">
          <div className="wrap">
            <Reveal className="sec-h">
              <span className="eyebrow">Ce que le modèle sait faire</span>
              <h2 className="display">
                Des chiffres vérifiés, <span className="hl">et leurs limites</span>.
              </h2>
            </Reveal>
            <div className="stats">
              <Reveal className="stat">
                <b><CountUp value={0.7063} decimals={4} /></b>
                <span>R² sur le jeu de test : part de la variance expliquée.</span>
              </Reveal>
              <Reveal className="stat" delay={0.08}>
                <b><CountUp value={0.95} decimals={2} /> pt</b>
                <span>Erreur absolue moyenne (MAE) sur 100.</span>
              </Reveal>
              <Reveal className="stat" delay={0.16}>
                <b><CountUp value={6} /></b>
                <span>Variables seulement : lisibles, donc explicables.</span>
              </Reveal>
              <Reveal className="stat" delay={0.24}>
                <b><CountUp value={0} /> €</b>
                <span>Coût d’utilisation. Outil entièrement gratuit.</span>
              </Reveal>
            </div>
            <Reveal className="row" style={{ marginTop: '2.4rem', alignItems: 'flex-start' }}>
              <span className="margin-note" style={{ fontSize: '1.6rem', color: 'var(--ink)' }}>⚠︎ À savoir :</span>
              <p className="muted" style={{ maxWidth: '44rem' }}>
                le modèle est entraîné sur un jeu de données public, pas sur votre établissement. Il donne un ordre de grandeur. Il ne remplace ni votre enseignant, ni votre travail.
              </p>
            </Reveal>
          </div>
        </section>

        <section className="sec" style={{ paddingTop: 0 }}>
          <div className="wrap grid g2" style={{ ['--g' as string]: '1.5rem' }}>
            <Reveal as="article" className="card">
              <span className="pill ink">Étudiant·e</span>
              <h3 className="display" style={{ margin: '.9rem 0 .6rem' }}>Votre espace</h3>
              <ul style={{ paddingLeft: '1.1rem', color: 'var(--ink-2)', display: 'grid', gap: '.4rem' }}>
                <li>Chronomètres d’étude et de tutorat</li>
                <li>Présence du jour, correction motivée</li>
                <li>Estimation, conseil, historique</li>
                <li>Séries et carte de chaleur</li>
              </ul>
            </Reveal>
            <Reveal as="article" className="card" delay={0.1}>
              <span className="pill mark">Administrateur</span>
              <h3 className="display" style={{ margin: '.9rem 0 .6rem' }}>Le pilotage</h3>
              <ul style={{ paddingLeft: '1.1rem', color: 'var(--ink-2)', display: 'grid', gap: '.4rem' }}>
                <li>Toutes les prédictions, triées du plus récent</li>
                <li>Liste des comptes et recherche instantanée</li>
                <li>Promotion et rétrogradation avec confirmation</li>
                <li>Export CSV pour vos rapports</li>
              </ul>
            </Reveal>
          </div>
        </section>

        <section className="sec faq" id="faq" style={{ paddingTop: 0 }}>
          <div className="wrap" style={{ maxWidth: 900 }}>
            <Reveal className="sec-h">
              <span className="eyebrow">Questions fréquentes</span>
              <h2 className="display">Vous vous demandez…</h2>
            </Reveal>
            {faqs.map(([q, a], i) => (
              <Reveal as="details" key={q} delay={i * 0.05} {...(i === 0 ? { open: true } : {})}>
                <summary>
                  {q}
                  <i aria-hidden="true">+</i>
                </summary>
                <p>{a}</p>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="sec" style={{ paddingTop: 0 }}>
          <div className="wrap">
            <Reveal className="cta-band">
              <span className="eyebrow">Prêt·e ?</span>
              <h2 className="display" style={{ margin: '1rem 0 1.6rem' }}>
                Deux minutes pour connaître <span style={{ background: 'var(--card)', padding: '0 .15em' }}>votre point de départ</span>.
              </h2>
              <div className="row">
                <Link className="btn" href="/register">
                  Créer mon compte <ArrowRight className="ar" size={18} aria-hidden="true" />
                </Link>
                <Link className="btn ghost" href="/login">
                  J’ai déjà un compte
                </Link>
              </div>
            </Reveal>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
