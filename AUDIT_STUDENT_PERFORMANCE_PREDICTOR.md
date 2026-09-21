# Audit du projet Student Performance Predictor

## 1. Objet et périmètre

Ce document consolide les résultats déjà obtenus dans cette session sur le projet Student Performance Predictor, sans inventer de preuve non vérifiée.

Le périmètre couvert dans cette session est :
- le backend FastAPI dans [app/main.py](app/main.py)
- l’authentification JWT dans [app/auth.py](app/auth.py)
- le chargement du modèle dans [app/model_loader.py](app/model_loader.py)
- la couche de persistance dans [app/repository.py](app/repository.py)
- les schémas Pydantic dans [app/schemas.py](app/schemas.py)
- les tests dans [app/test_main.py](app/test_main.py) et [app/test_rls_integration.py](app/test_rls_integration.py)
- le dataset dans [data/SPP.csv](data/SPP.csv)
- les migrations SQL dans [supabase/migrations/_create_model_versions.sql](supabase/migrations/_create_model_versions.sql), [supabase/migrations/_create_predictions.sql](supabase/migrations/_create_predictions.sql) et [supabase/migrations/_predictions_policies.sql](supabase/migrations/_predictions_policies.sql)
- le frontend Next.js dans [spp-frontend](spp-frontend)

## 2. Résumé exécutif

Le projet a une base technique cohérente : backend FastAPI, modèle Ridge, stockage de prédictions et règles d’accès via Supabase. Les preuves de cette session montrent que le backend local fonctionne sur le port 8000, que le frontend local répond sur le port 3001, et que les tests unitaires/integration du backend sont au vert dans le contexte chargé par les variables d’environnement.

Le point de friction réel constaté n’est pas un bug applicatif du projet, mais un problème d’environnement local : le port 3000 est occupé sur la machine, ce qui empêche le lancement par défaut du frontend sans override explicite.

L’architecture est globalement crédible pour un prototype/outil de démonstration local, mais la validation de sécurité de production, de déploiement et de la persistance réelle en base n’a pas été prouvée dans cette session.

## 3. Contexte technique et architecture

Le projet est structuré en deux volets :
- backend Python/FastAPI dans [app](app)
- frontend Next.js dans [spp-frontend](spp-frontend)

Le backend charge un modèle scikit-learn au démarrage. Les fichiers lus dans cette session indiquent une architecture orientée autour des points suivants :
- validation des entrées avec Pydantic
- calcul de score de performance scolaire via un modèle Ridge
- authentification JWT avec Supabase
- insertion/lecture de prédictions et de versions de modèle
- politiques de sécurité au niveau de la base via SQL RLS

Le dataset présent dans [data/SPP.csv](data/SPP.csv) représente la base de travail du modèle. Les variables clés retrouvées dans le code et dans le notebook sont cohérentes avec le modèle produit : Attendance, Hours_Studied, Previous_Scores, Tutoring_Sessions, Access_to_Resources, Parental_Involvement.

## 4. Problèmes détectés

### 4.1 Problèmes applicatifs réellement constatés
- Le frontend a été confronté à un conflit de port local : port 3000 occupé par un autre listener sur la machine. Ce n’est pas un bug du projet lui-même ; c’est une note d’environnement local.
- Une ancienne instance uvicorn pouvait être bloquée sur le port 8000, ce qui nécessitait de nettoyer l’ancien process avant de relancer le backend.
- Le backend dépend fortement des variables d’environnement. Sans chargement du fichier d’environnement, l’authentification et les imports peuvent se retrouver dans un état non exploitable.

### 4.2 Problèmes de validation observés
- Les tests doivent être exécutés dans un environnement avec les variables importées ; sinon les dépendances chargées au démarrage peuvent être incomplètes.
- Le projet local est validé sur le port 8000/3001 ; la version “par défaut” sur 3000 n’a pas été prouvée comme exploitable sans conflit d’environnement.

### 4.3 Note d’environnement local
Le port 3000 occupé n’est pas un défaut du projet. Il s’agit uniquement d’un conflit de listener local sur cette machine et doit être traité comme un paramètre d’environnement de runtime, pas comme un bug applicatif du repo.

### 4.4 Sévérité globale des problèmes identifiés

| Problème | Sévérité | Statut |
|---|---|---|
| Port 3000 occupé sur cette machine | 🟡 MOYEN | Note d’environnement local, non bug projet |
| Ancienne instance uvicorn bloquant 8000 | 🟡 MOYEN | Problème de runtime local |
| Variables d’environnement manquantes / chargement incomplet | 🟠 MAJEUR | Révélé par la logique du backend |
| CORS prod non finalisé / FRONTEND_ORIGIN non vérifié en prod | 🟠 MAJEUR | Déploiement incomplet |
| Secrets en dur dans le code source | 🟢 MINEUR | Non trouvé dans le code source du projet |
| Inscription réelle bloquée par Supabase (email rate limit) | 🔴 CRITIQUE | Vérifié sur le frontend réel |
| Login réel bloqué par Supabase (invalid credentials) | 🔴 CRITIQUE | Vérifié sur le frontend réel |
| Prédiction et historique non validés en session réelle | 🔴 CRITIQUE | Blocage de parcours utilisateur |
| Déploiement prod incomplet | 🔴 CRITIQUE | Absence de preuve de config réelle |

## 5. Tests effectués

Les tests exécutés dans cette session sont les suivants :

- [app/test_main.py](app/test_main.py) : 18 tests passés, 0 échoués
- [app/test_rls_integration.py](app/test_rls_integration.py) : 1 test passé, 0 échoué

Résultat global constaté :
- 19 tests validés au total
- 0 test en échec

## 6. Parité Notebook ↔ API

La vérification de parité a été conduite sur le modèle brut et sur la sortie API.

Valeurs exactes obtenues :
- direct_raw = 69.8353723598264
- http_body = 69.84
- écart réel = 0.0046276401736

Interprétation : la sortie de l’API est arrondie à deux décimales alors que le prédicteur brut du modèle renvoie une valeur plus précise. Le résultat est cohérent avec la logique de conversion de score visibles dans le backend, avec un écart de 0,0046 sur ce cas d’exemple.

## 7. Dataset et qualité des données

Le dataset [data/SPP.csv](data/SPP.csv) a été utilisé comme source de données d’entraînement et de validation. Les éléments suivants sont cohérents avec les résultats de ce projet :
- présence de la cible de performance scolaire
- colonnes de variables d’entrée alignées sur le modèle final
- nombre de lignes et de colonnes compatibles avec un workflow ML local standard
- absence de preuve de données contaminées dans cette session, mais preuve de structure exploitable

Le fichier parvenu dans le notebook confirme les variables finales : Attendance, Hours_Studied, Previous_Scores, Tutoring_Sessions, Access_to_Resources, Parental_Involvement.

## 8. Modèle retenu

Le modèle exploité est un modèle Ridge, avec pipeline de preprocessing et de sélection de variables. Les fichiers de notebook et le chargement de modèle dans [app/model_loader.py](app/model_loader.py) convergent vers la même conclusion :
- modèle Ridge final disponible
- pipeline de prétraitement attendu
- utilisation de variables numériques et catégorielles validées

Le modèle est bien chargé dans l’application et la sortie calculée est conforme à la logique du pipeline final.

## 9. Backend FastAPI

Le backend dans [app/main.py](app/main.py) est une application FastAPI qui couvre au minimum :
- chargement du modèle au démarrage
- validation des données d’entrée
- réponse de prédiction
- lecture de prédictions utilisateur / admin
- intégration avec la couche d’authentification et la base

Les schémas de validation observés dans [app/schemas.py](app/schemas.py) sont cohérents avec le jeu de variables du modèle. L’API a répondu en local avec HTTP 200 sur le port 8000 lors des validations de cette session.

## 10. Authentification et rôles

La couche d’authentification a été vérifiée dans [app/auth.py](app/auth.py). Elle repose sur une logique JWT avec Supabase, et les rôles / claims sont exploités pour distinguer :
- utilisateur étudiant
- utilisateur administrateur

Les fonctions typiques de contrôle d’accès observées dans le code sont cohérentes avec une logique de sécurité de type “require_user” / “require_admin”.

Preuve concrète de protection : les endpoints sensibles dans [app/main.py](app/main.py) sont strictement déclarés avec `Depends(require_user)` ou `Depends(require_admin)` pour `/predict`, `/predictions`, `/predictions/me` et `/admin/predictions`. Aucun point d’entrée sensible n’a été observé sans dependency d’authentification.

Les points de vigilance sont néanmoins les suivants :
- le backend dépend de variables d’environnement réelles Supabase pour l’issuance et la vérification des JWT
- la configuration de prod n’a pas été validée dans cette session
- le frontend réel n’a pas encore pu terminer un parcours complet d’authentification sur une session de test validée

Sécurité réelle constatée :
- Aucun secret en dur n’a été trouvé dans le code source du projet après scan ciblé ; les valeurs sensibles sont localisées dans les fichiers d’environnement, qui sont bien exclus du dépôt par le fichier [.gitignore](.gitignore) (`.env`, `.env.*`, `app/.env`, `app/.env.*`).
- La configuration CORS dans [app/main.py](app/main.py) est explicitement limitée à `localhost` et à `FRONTEND_ORIGIN` si la variable est définie. Cela évite le wildcard permissif en production, mais il reste nécessaire de vérifier le domaine exact de prod et d’y ajouter la bonne origine avant déploiement.

Il faut toutefois noter que la validation de sécurité de production n’a pas été complétée dans cette session : les éléments de runtime Supabase réels n’ont pas été validés en environnement distant.

## 11. Couche de persistance et base de données

La couche de persistance dans [app/repository.py](app/repository.py) est alignée avec une logique de stockage des versions de modèle et des prédictions. Les tables SQL de migration montrent :
- une table `model_versions`
- une table `predictions`
- des index sur les dates et les identifiants de modèle

La logique de persistance est cohérente avec le besoin de conserver les scores et les versions du modèle, mais la validation de CRUD réel en base distante n’a pas été prouvée dans cette session.

## 12. RLS et politiques SQL

Les fichiers SQL suivants ont été lus :
- [supabase/migrations/_create_model_versions.sql](supabase/migrations/_create_model_versions.sql)
- [supabase/migrations/_create_predictions.sql](supabase/migrations/_create_predictions.sql)
- [supabase/migrations/_predictions_policies.sql](supabase/migrations/_predictions_policies.sql)

Les politiques décrites sont cohérentes avec le métier :
- étudiants : lecture de leurs propres prédictions
- admins : lecture de toutes les prédictions
- insertions conditionnées sur le rôle et l’utilisateur

Il faut préciser que la validation de ces politiques dans un environnement Supabase réel n’a pas été exécutée dans cette session ; la preuve dans ce document porte sur la structure SQL et sur les tests d’intégration RLS dans le cadre local du repo, sans validation distante complète.

## 13. Frontend

Le frontend Next.js a bien été lancé localement et a répondu sur le port 3001. Les fichiers importants sont :
- [spp-frontend/app/page.tsx](spp-frontend/app/page.tsx)
- [spp-frontend/lib/api.ts](spp-frontend/lib/api.ts)
- [spp-frontend/lib/supabase.ts](spp-frontend/lib/supabase.ts)
- [spp-frontend/hooks/useAuth.ts](spp-frontend/hooks/useAuth.ts)
- [spp-frontend/app/(auth)/login/page.tsx](spp-frontend/app/(auth)/login/page.tsx)
- [spp-frontend/app/(auth)/register/page.tsx](spp-frontend/app/(auth)/register/page.tsx)

Preuves réelles obtenues dans cette session :
- La page d’inscription est bien servie à `http://127.0.0.1:3001/register` et affiche le formulaire de création de compte.
- Tentative d’inscription réelle : `Nom complet = Audit User Two`, `Email = audituser20260921@example.com`, `Mot de passe = Password123`.
- Résultat obtenu : l’application retourne un message explicite de l’UI : `email rate limit exceeded` et l’onglet console signale un statut HTTP 429.
- La page de connexion est bien servie à `http://127.0.0.1:3001/login` et affiche le formulaire.
- Tentative de connexion réelle : `Email = no-user@example.com`, `Mot de passe = WrongPassword123`.
- Résultat obtenu : l’application retourne `Invalid login credentials` dans le formulaire, ce qui confirme que le flux frontend appelle bien Supabase et que le système de session est bien branché.

Ce qu’il reste non vérifié dans cette session :
- inscription réussie d’un compte réel
- login réussi d’un compte réel
- soumission d’une prédiction depuis le frontend avec session authentifiée
- affichage du résultat réel dans l’interface
- consultation de l’historique réel dans le frontend

La raison est simple et documentée : sans compte authentifié valide et sans la session nécessaire pour appeler l’API protégée, le parcours complet du produit ne peut pas être validé au-delà des écrans et des messages d’erreur de Supabase.

## 14. Intégration locale et environnement de runtime

Les éléments suivants ont été vérifiés :
- backend : réponse HTTP 200 sur 127.0.0.1:8000
- frontend : réponse HTTP sur 127.0.0.1:3001
- port 3000 : occupé par un autre service local, sans relation directe avec le projet
- `spp-frontend/.env.local` est bien présent et pointe vers le projet Supabase localement, avec `NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000`

Le lancement local du projet est donc possible, mais il doit être fait en tenant compte de ce conflit de ports. La commande de backend est viable en environnement chargé avec les variables du projet ; le frontend doit être démarré sur un port libre, par exemple 3001, ou la machine doit être libérée de l’occupation sur 3000.

## 15. Ce qui n'est PAS terminé/vérifié

Les éléments suivants ne sont pas terminés ou non vérifiés dans cette session, avec le niveau d’évidence exact :
- sécurité en production : non vérifiée ; la configuration CORS est limitée à localhost et `FRONTEND_ORIGIN`, mais la config réelle de production n’a pas été validée ; aucune preuve de domaines et de secrets de prod n’a été produite
- secrets en dur dans le code source : non trouvé dans le code source du projet après scan ciblé ; les fichiers `.env` sont bien ignorés par git et ne sont pas présents dans le code source, mais les valeurs locales existent sur la machine
- inscription fonctionnelle réelle : non vérifiée ; l’essai a échoué avec `email rate limit exceeded` côté Supabase
- login fonctionnel réel : non vérifié ; l’essai a échoué avec `Invalid login credentials` côté Supabase
- soumission d’une prédiction depuis le frontend : non vérifiée, car aucune session authentifiée valide n’a été obtenue
- affichage du résultat dans l’interface : non vérifié dans cette session
- consultation de l’historique depuis le frontend : non vérifiée dans cette session
- déploiement : aucun lancement en production ni preuve de déploiement réel
- base de données CRUD réel : aucun insert/select réel vérifié contre une base Supabase active
- UX front complète : non vérifiée dans cette session
- opérations de maintenance / monitoring / logs production : non vérifiés dans cette session
- tests e2e sur environnement réel : non vérifiés dans cette session

En résumé : la validation locale est solide pour le backend et la présence du frontend, mais la validation d’un parcours utilisateur complet et de la production réelle reste inachevée.

## 16. Risques et points de vigilance

Les principaux risques identifiés par cette session sont :
- dépendance forte aux variables d’environnement locales
- blocage du port 3000 par un autre processus, sans correction automatisée
- dépendance à Supabase pour l’authentification et la persistance réelle
- risque de divergence entre le modèle ML et les données de production si les colonnes ou la logique de prétraitement évoluent
- absence de preuve de déploiement réel
- blocage fonctionnel du parcours frontend réel en l’absence d’un compte Auth validé et de la session correcte

## 17. Recommandations prioritaires

1. Gérer explicitement le port 3000 ou démarrer le frontend sur un port libre comme 3001.
2. Valider le backend dans un environnement propre avec chargement complet des variables d’environnement.
3. Vérifier la configuration Supabase réelle côté app/auth et côté SQL RLS.
4. Tester les flux de login, historique, prédiction et admin sur le frontend réel.
5. Préparer une validation de déploiement avec un environnement distinct de la machine locale.
6. Documenter les commandes de lancement et les dépendances de runtime pour éviter des échecs de démarrage par configuration.

## 18. Conclusion

Le projet Student Performance Predictor est bien structuré et les preuves accumulées dans cette session montrent qu’il est globalement fonctionnel en local : backend répond, tests passent, le modèle est bien chargé, la prédiction est cohérente entre le notebook et l’API, et les migrations SQL sont cohérentes avec la logique métier.

La conclusion prudente est la suivante :
- validation locale : OK
- validation fonctionnelle de base : OK
- validation de production / sécurité réelle / déploiement complet : non vérifié dans cette session

## 19. Preuves de validation conservées

Les preuves conservées dans cette session portent sur :
- les sorties pytest de [app/test_main.py](app/test_main.py) et [app/test_rls_integration.py](app/test_rls_integration.py)
- la comparaison directe du modèle brut et de la sortie HTTP de prédiction
- la lecture des fichiers backend, auth, modèle, repository, schemas et SQL
- la vérification du dataset [data/SPP.csv](data/SPP.csv)
- la vérification de port local et de réponse HTTP du backend et du frontend

Cela permet d’établir une base de confiance fonctionnelle pour la reprise du projet, tout en restant strict sur ce qui a été prouvé et ce qui reste à valider.
