# ADR-001: Supabase Auth, PostgreSQL and Student/Admin Roles

## Context

Le MVP doit proposer une authentification reelle et un historique personnel. Deux roles sont fonctionnels des la demonstration : `student` voit et cree ses propres predictions ; `admin` supervise en lecture l'ensemble des profils et predictions. Le backend FastAPI conserve le modele ML et doit verifier les droits, meme si le frontend est contourne.

Le depot ne contient encore aucune base, migration, authentification integree ou frontend versionne. La prediction actuelle a six features et son contrat `/predict` doit rester inchange.

## Decision

Nous utiliserons Supabase pour PostgreSQL et Supabase Auth. `auth.users` reste geree par Supabase et ne sera pas recreee dans le schema applicatif.

Le schema minimal est :

- `profiles`: `id` FK vers `auth.users.id`, `role` enum `student|admin`, `created_at` ;
- `model_versions`: `id`, chemin ou identifiant d'artefact, date d'entrainement, metriques de validation et identite immuable de la version ;
- `predictions`: `id`, `user_id` FK vers `auth.users.id`, `model_version_id`, snapshot des six features (`Attendance`, `Hours_Studied`, `Previous_Scores`, `Tutoring_Sessions`, `Access_to_Resources`, `Parental_Involvement`), score predit, duree de calcul optionnelle et `created_at`.

Aucune donnee personnelle supplementaire n'est necessaire : pas de nom, pas de note scolaire reelle d'etablissement. L'email reste dans Supabase Auth.

Les migrations SQL seront versionnees dans `supabase/migrations`.

## Roles and RLS

RLS sera activee sur `profiles` et `predictions` avant toute utilisation applicative :

- `student`: `SELECT` et `INSERT` uniquement sur ses propres lignes de `predictions`, avec `auth.uid() = user_id` ; aucune lecture des donnees d'un autre utilisateur ;
- `admin`: `SELECT` global sur `predictions` et `profiles` ; aucun droit d'ecriture sur les donnees d'un tiers sauf decision explicite ulterieure ;
- les modifications et suppressions de predictions d'un tiers ne font pas partie du MVP.

Le backend FastAPI doit verifier le JWT Supabase et le role `admin` avant la route d'administration. Le frontend ne sera jamais la seule barriere. Dans la preparation actuelle, `GET /admin/predictions` passe par `require_admin`, valide la signature JWT puis refuse un role `student` avec HTTP 403 ; la route retourne HTTP 501 tant que Supabase n'est pas connecte.

Le role applicatif doit etre emis dans un claim de confiance, actuellement `app_metadata.role` (ou `user_role` pour compatibilite de preparation). Une colonne `profiles.role` seule ne suffit pas a autoriser une requete backend si le backend ne consulte pas Supabase ; la strategie finale de synchronisation du claim et de la table devra etre validee pendant l'implementation des migrations.

## First Admin Account

Decision a valider explicitement : pour la demo, creer le premier compte admin par seed manuel controle dans Supabase, apres creation du compte Auth, puis renseigner `profiles.role = 'admin'` et le claim de confiance necessaire. Aucun endpoint public de promotion de role ne sera ajoute par defaut.

## Environment and Dependencies

Variables locales dans `.env`, jamais commitees : `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (backend uniquement), `SUPABASE_JWT_SECRET` et optionnellement `SUPABASE_JWT_AUDIENCE`.

La preparation Python actuelle ajoute `PyJWT` pour verifier localement les tokens HS256 et garde les routes non connectees. L'implementation Supabase devra choisir entre le client officiel `supabase-py` et SQLAlchemy + driver PostgreSQL ; ce choix est a valider avant d'ajouter la connexion. La cle `service_role` ne doit jamais etre envoyee au frontend ni utilisee pour contourner les policies sans justification.

## Consequences

Le MVP est multi-utilisateur et auditable par version de modele. Il faut gerer les migrations, les claims de role, la rotation des secrets, les tests RLS et la retention. Le flux reste explicitement incomplet tant que les routes de persistence renvoient 501.

## Alternatives considered

- SQLite local : rejete pour le MVP cible, car il ne fournit pas Supabase Auth/RLS hebergees.
- Une table `users` applicative recreee manuellement : rejetee, car `auth.users` est la source d'identite Supabase.
- Controle de role uniquement dans Next.js : rejete, car l'autorisation doit etre verifiee cote backend.
- Admin pouvant modifier les predictions d'un tiers : hors perimetre du MVP.