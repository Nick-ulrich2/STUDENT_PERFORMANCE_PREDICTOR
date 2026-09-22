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

Aucune donnee personnelle supplementaire n'est necessaire : pas de nom, pas de note scolaire reelle d'etablissement. L'email reste dans Supabase Auth. Le schema reel inclut aussi `activity_logs` (evenements bruts start/stop/correction) et trois colonnes sur `profiles` (`previous_scores`, `access_to_resources`, `parental_involvement`) pour le suivi d'habitudes ; voir [`supabase/migrations/0006_activity_logs_and_profile_attributes.sql`](../supabase/migrations/0006_activity_logs_and_profile_attributes.sql).

Les migrations SQL sont versionnees dans [`supabase/migrations/`](../supabase/migrations/), numerotees `0001` a `0008` dans leur ordre de dependance reel (tables de base, puis `profiles`, puis durcissement des policies). Elles doivent etre executees manuellement, dans cet ordre, dans l'editeur SQL du dashboard Supabase avant les tests end-to-end.

## Migration execution

1. Ouvrir le projet Supabase cible et aller dans **SQL Editor**.
2. Pour chaque fichier de `supabase/migrations/`, dans l'ordre numerique (`0001_...` en premier, `0008_...` en dernier) : creer une nouvelle query, coller le contenu du fichier sans modifier les noms de colonnes, executer, verifier l'absence d'erreur avant de passer au fichier suivant.
3. Dans **Table Editor**, verifier les tables `public.profiles`, `public.model_versions`, `public.predictions` et `public.activity_logs` et leurs colonnes.
4. Dans **Authentication**, creer ou utiliser des comptes de test student et admin.
5. Dans **Database > Policies**, verifier que les policies RLS listees plus bas sont actives sur chaque table, et qu'aucune ne leve `infinite recursion detected in policy` sur un simple `SELECT` (executer `select * from public.profiles limit 1;` en tant qu'utilisateur authentifie est le test le plus rapide).
6. Tester avec de vrais JWT : un student ne doit lire que ses lignes, tandis qu'un admin peut lire toutes les lignes.

Ces migrations ne sont pas executees automatiquement par le backend et aucun secret n'est necessaire dans les fichiers SQL. **Ne pas** appliquer d'ancienne copie locale ou email du fichier `_auth_role_claims.sql` : ce fichier definissait un trigger dont la logique est desormais recreee correctement par `0005_remove_insecure_role_sync_trigger.sql` et a ete retire du depot le 2026-09-23 (voir le correctif de securite ci-dessous) ; le reappliquer par-dessus reintroduirait la faille de la section suivante et casserait a nouveau les inscriptions.

## Roles and RLS

RLS sera activee sur `profiles` et `predictions` avant toute utilisation applicative :

- `student`: `SELECT` et `INSERT` uniquement sur ses propres lignes de `predictions`, avec `auth.uid() = user_id` ; aucune lecture des donnees d'un autre utilisateur ;
- `admin`: `SELECT` global sur `predictions` et `profiles`, ainsi que `INSERT` sur `predictions` pour ses propres lignes (`auth.uid() = user_id`) ; aucun droit de modification ou de suppression des donnees d'un tiers ;
- les modifications et suppressions de predictions d'un tiers ne font pas partie du MVP.

Le backend FastAPI verifie le JWT Supabase et le role `admin` avant la route d'administration. Le frontend ne sera jamais la seule barriere. `GET /admin/predictions` passe par `require_admin`, valide la signature JWT puis refuse un role `student` avec HTTP 403. Les trois routes FastAPI utilisent maintenant `get_supabase_client(current_user["jwt"])`; leur fonctionnement end-to-end depend de l'execution manuelle de la migration et de vrais tokens Supabase.

Le role applicatif doit etre emis dans un claim de confiance : **uniquement** `app_metadata.role`. Une colonne `profiles.role` seule ne suffit pas a autoriser une requete backend si le backend ne consulte pas Supabase ; la strategie finale de synchronisation du claim et de la table devra etre validee pendant l'implementation des migrations.

**Correctif de securite (2026-09-22)** : une version anterieure du backend et de la migration `_auth_role_claims.sql` (retiree du depot, voir plus haut) acceptaient aussi `user_metadata.role` (et un claim `user_role`) comme source de role. Ces champs sont fixes par le client a l'inscription (`supabase.auth.signUp({ options: { data: { role: ... } } })`) et ne sont donc pas dignes de confiance : n'importe qui pouvait s'auto-attribuer le role `admin` en appelant l'API Supabase Auth directement, en contournant le frontend. `app/auth.py::_extract_role` ne lit plus que `app_metadata.role`, et la migration `0005_remove_insecure_role_sync_trigger.sql` remplace le trigger de synchronisation par un trigger qui force `role='student'` a l'inscription (INSERT uniquement, jamais recalcule sur une mise a jour de profil), quel que soit le role envoye par le client ; `0008_fix_app_metadata_column_in_signup_trigger.sql` corrige ensuite un bug d'implementation de ce meme trigger (il ecrivait dans `new.app_metadata`, qui n'est pas une colonne reelle de `auth.users` — la colonne est `raw_app_meta_data` — ce qui faisait echouer toute inscription avec une 500 tant que ce n'etait pas corrige). La promotion `admin` reste un acte manuel cote serveur (dashboard Supabase ou Admin API avec la `service_role` key), comme decide plus haut.

**Incident connu (2026-09-22/23)** : sur au moins un projet Supabase reel utilise pour le developpement, la policy `profiles_admin_can_read_all` active en base ne correspondait pas (encore) a la version corrigee ci-dessus et provoquait `infinite recursion detected in policy for relation "profiles"` (Postgres `42P17`) sur tout `SELECT` de `profiles`, cassant `/me/profile-attributes`, `/me/features` et donc `/predict/from-activity`. La definition dans `0004_create_profiles_and_fix_model_versions.sql` / `0007_harden_role_checks_in_rls_policies.sql` est correcte (elle lit `auth.jwt()`, jamais une sous-requete sur `profiles`) et un test d'integration (`app/test_rls_integration.py`) rejoue desormais l'integralite des 8 migrations contre un Postgres reel pour verifier qu'aucun `SELECT` sur `profiles` ne recurse. Si ce symptome reapparait sur un projet Supabase donne, la cause est presque certainement que ces migrations n'ont pas (encore) ete executees sur ce projet precis — voir *Migration execution* ci-dessus.

## First Admin Account

Decision a valider explicitement : pour la demo, creer le premier compte admin par seed manuel controle dans Supabase, apres creation du compte Auth, puis renseigner `profiles.role = 'admin'` et le claim de confiance necessaire. Aucun endpoint public de promotion de role ne sera ajoute par defaut.

## Environment and Dependencies

Variables locales dans `.env`, jamais commitees : `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (backend uniquement) et optionnellement `SUPABASE_JWT_AUDIENCE`.

Le backend utilise `PyJWT` pour verifier chaque token avec l'algorithme **ES256**, contre la cle publique recuperee dynamiquement sur le JWKS de Supabase (`{SUPABASE_URL}/auth/v1/.well-known/jwks.json`, mis en cache cote process pendant 4h — voir `app/auth.py`). Il n'y a pas de secret HS256 partage : `SUPABASE_JWT_SECRET` n'est donc plus utilise et peut etre retire de `.env`. L'implementation Supabase utilise le client officiel `supabase-py` pour toutes les operations de persistance. La cle `service_role` ne doit jamais etre envoyee au frontend ni utilisee pour contourner les policies sans justification.

## Communication frontend/backend

Le navigateur appelle FastAPI **directement** (`spp-frontend/lib/api.ts`, avec le JWT Supabase attache en `Authorization: Bearer` sur chaque requete), pas via des routes serveur Next.js intermediaires. Ce point differe de la formulation initiale de la roadmap ("architecture BFF : le navigateur ne communique jamais directement avec FastAPI") ; ce document fait foi sur la decision reellement implementee. L'autorisation reste verifiee cote FastAPI sur chaque route (`require_user`/`require_admin`), donc le frontend n'est pas la seule barriere de securite meme sans BFF ; en revanche `NEXT_PUBLIC_API_BASE_URL` et la configuration CORS de FastAPI (`FRONTEND_ORIGIN`) doivent rester corrects, et le token d'acces Supabase est visible dans l'onglet reseau du navigateur (attendu pour ce pattern, a ne pas confondre avec une fuite).

## Consequences

Le MVP est multi-utilisateur et auditable par version de modele. Il faut encore gerer les migrations executees, les claims de role, la rotation des secrets, les tests RLS et la retention. La persistance est implementee cote code mais reste non verifiee manuellement contre le projet Supabase distant.

## Alternatives considered

- SQLite local : rejete pour le MVP cible, car il ne fournit pas Supabase Auth/RLS hebergees.
- Une table `users` applicative recreee manuellement : rejetee, car `auth.users` est la source d'identite Supabase.
- Controle de role uniquement dans Next.js : rejete, car l'autorisation doit etre verifiee cote backend.
- Admin pouvant modifier les predictions d'un tiers : hors perimetre du MVP.