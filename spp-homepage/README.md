# SPP Homepage

Landing page statique pour **Student Performance Predictor**, construite avec Next.js (App Router), TypeScript et Tailwind CSS.

## Installer et lancer

```bash
npm install
npm run dev
```

Ouvrir ensuite `http://localhost:3000`. Pour vérifier la production :

```bash
npm run build
npm start
```

## Structure

- `app/` — layout, page d'accueil, styles globaux
- `components/ui/` — boutons et introductions de section
- `components/layout/` — navbar responsive
- `sections/` — HeroSection, HowItWorksSection, ProductPreviewSection, TrustSection, AudienceSection, FAQSection, FinalCTASection
- `data/` — navigation, FAQ et audiences statiques
- `hooks/` — hook du menu mobile
- `types/` — types TypeScript
- `lib/` — réservé aux utilitaires futurs
