# ADR-001: Supabase Auth, PostgreSQL and Student/Admin Roles

## Context

Le MVP doit proposer une authentification reelle et un historique personnel. Deux roles sont fonctionnels des la demonstration : `student` voit et cree ses propres predictions ; `admin` supervise en lecture l'ensemble des profils et predictions. Le backend FastAPI conserve le modele ML et doit verifier les droits, meme si le frontend est contourne.

Le depot ne contient encore aucune base distante executee ni frontend versionne. La migration SQL est versionnee dans le depot, l'authentification JWT est integree cote backend et la prediction actuelle a six features ; son contrat `/predict` doit rester inchange.

## Decision

Nous utiliserons Supabase pour PostgreSQL et Supabase Auth. `auth.users` reste geree par Supabase et ne sera pas recreee dans le schema applicatif.

Le schema minimal est :

- `profiles`: `id` FK vers `auth.users.id`, `role` enum `student|admin`, `created_at` ;
- `model_versions`: `id`, chemin ou identifiant d'artefact, date d'entrainement, metriques de validation et identite immuable de la version ;
- `predictions`: `id`, `user_id` FK vers `auth.users.id`, `model_version_id`, snapshot des six features (`Attendance`, `Hours_Studied`, `Previous_Scores`, `Tutoring_Sessions`, `Access_to_Resources`, `Parental_Involvement`), score predit, duree de calcul optionnelle et `created_at`.

Aucune donnee personnelle supplementaire n'est necessaire : pas de nom, pas de note scolaire reelle d'etablissement. L'email reste dans Supabase Auth.

La premiere migration SQL est maintenant implementee dans [`supabase/migrations/202609190001_create_predictions.sql`](../supabase/migrations/202609190001_create_predictions.sql). Elle cree `predictions`, active RLS et ajoute les policies student/admin. Elle doit etre executee manuellement dans l'editeur SQL du dashboard Supabase avant les tests end-to-end.

## Migration execution

1. Ouvrir le projet Supabase cible et aller dans **SQL Editor**.
2. Creer une nouvelle query.
3. Copier le contenu de `supabase/migrations/202609190001_create_predictions.sql` sans modifier les noms de colonnes.
4. Executer la query et verifier l'absence d'erreur.
5. Dans **Table Editor**, verifier la table `public.predictions` et ses colonnes.
6. Dans **Authentication**, creer ou utiliser des comptes de test student et admin.
7. Dans **Database > Policies**, verifier que les trois policies RLS sont actives.
8. Tester avec de vrais JWT : un student ne doit lire que ses lignes, tandis qu'un admin peut lire toutes les lignes.

Cette migration n'est pas executee automatiquement par le backend et aucun secret n'est necessaire dans le fichier SQL.

## Roles and RLS

RLS sera activee sur `profiles` et `predictions` avant toute utilisation applicative :

- `student`: `SELECT` et `INSERT` uniquement sur ses propres lignes de `predictions`, avec `auth.uid() = user_id` ; aucune lecture des donnees d'un autre utilisateur ;
- `admin`: `SELECT` global sur `predictions` et `profiles` ; aucun droit d'ecriture sur les donnees d'un tiers sauf decision explicite ulterieure ;
- les modifications et suppressions de predictions d'un tiers ne font pas partie du MVP.

Le backend FastAPI verifie le JWT Supabase et le role `admin` avant la route d'administration. Le frontend ne sera jamais la seule barriere. `GET /admin/predictions` passe par `require_admin`, valide la signature JWT puis refuse un role `student` avec HTTP 403. Les trois routes FastAPI utilisent maintenant `get_supabase_client(current_user["jwt"])`; leur fonctionnement end-to-end depend de l'execution manuelle de la migration et de vrais tokens Supabase.

Le role applicatif doit etre emis dans un claim de confiance, actuellement `app_metadata.role` (ou `user_role` pour compatibilite de preparation). Une colonne `profiles.role` seule ne suffit pas a autoriser une requete backend si le backend ne consulte pas Supabase ; la strategie finale de synchronisation du claim et de la table devra etre validee pendant l'implementation des migrations.

## First Admin Account

Decision a valider explicitement : pour la demo, creer le premier compte admin par seed manuel controle dans Supabase, apres creation du compte Auth, puis renseigner `profiles.role = 'admin'` et le claim de confiance necessaire. Aucun endpoint public de promotion de role ne sera ajoute par defaut.

## Environment and Dependencies

Variables locales dans `.env`, jamais commitees : `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (backend uniquement), `SUPABASE_JWT_SECRET` et optionnellement `SUPABASE_JWT_AUDIENCE`.

La preparation Python actuelle ajoute `PyJWT` pour verifier localement les tokens HS256 et garde les routes non connectees. L'implementation Supabase devra choisir entre le client officiel `supabase-py` et SQLAlchemy + driver PostgreSQL ; ce choix est a valider avant d'ajouter la connexion. La cle `service_role` ne doit jamais etre envoyee au frontend ni utilisee pour contourner les policies sans justification.

## Consequences

Le MVP est multi-utilisateur et auditable par version de modele. Il faut encore gerer les migrations executees, les claims de role, la rotation des secrets, les tests RLS et la retention. La persistance est implementee cote code mais reste non verifiee manuellement contre le projet Supabase distant.

## Alternatives considered

- SQLite local : rejete pour le MVP cible, car il ne fournit pas Supabase Auth/RLS hebergees.
- Une table `users` applicative recreee manuellement : rejetee, car `auth.users` est la source d'identite Supabase.
- Controle de role uniquement dans Next.js : rejete, car l'autorisation doit etre verifiee cote backend.
- Admin pouvant modifier les predictions d'un tiers : hors perimetre du MVP.