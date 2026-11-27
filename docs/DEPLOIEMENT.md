# Déploiement en ligne de Teranga Voyages

Architecture (gratuite pour démarrer) :

| Rôle | Service | Adresse type |
|---|---|---|
| Site React | **Cloudflare Pages** | `https://teranga-voyages.pages.dev` |
| API Laravel | **Render** (Docker, plan Free) | `https://teranga-api.onrender.com` |
| Base de données | **Neon** (PostgreSQL, plan Free) | `ep-xxxx.eu-central-1.aws.neon.tech` |
| E-mails | **Brevo** (API HTTP) | expéditeur validé |
| Nom de domaine + DNS (optionnel) | **Cloudflare** | `www.votre-domaine.com`, `api.votre-domaine.com` |
| Code, tests, cron | **GitHub** | `github.com/faLucas17/teranga-voyages` |

Ordre : 1. Neon → 2. Copie des données → 3. Brevo → 4. Render → 5. Cloudflare Pages → 6. Relier les deux → 7. Cron → 8. Domaine (optionnel) → 9. Sécurité.

---

## 1. Base de données : Neon

1. Créez un compte sur https://neon.tech → **New project**.
   - Nom : `teranga-voyages`
   - Région : **AWS Europe (Frankfurt)**, la même que Render, pour des réponses rapides.
   - Version PostgreSQL : 16 ou plus.
2. Sur la page du projet, cliquez **Connect** :
   - **décochez « Connection pooling »** (on veut la connexion directe, l'adresse ne doit pas contenir `-pooler`) ;
   - copiez la chaîne de connexion. Elle ressemble à :
     `postgresql://neondb_owner:MOT_DE_PASSE@ep-xxxx.eu-central-1.aws.neon.tech/neondb?sslmode=require`

> Neon gratuit : 0,5 Go de stockage, largement assez pour démarrer. La base se met en veille quand personne ne l'utilise et se réveille toute seule en une seconde environ.

## 2. Copier vos données locales vers Neon

Vos voyages, comptes et réservations sont dans le MySQL de Docker. Une commande les copie dans Neon.

1. Reconstruisez l'API locale une fois (elle reçoit le pilote PostgreSQL) :
   ```bash
   cd ~/teranga-voyages
   git pull
   docker compose up -d --build
   ```
2. Lancez la copie (mettez votre chaîne Neon **entre guillemets**) :
   ```bash
   docker compose exec backend php artisan app:copy-database "postgresql://neondb_owner:MOT_DE_PASSE@ep-xxxx.eu-central-1.aws.neon.tech/neondb?sslmode=require"
   ```
   La commande crée les tables dans Neon, **vide** Neon, puis copie chaque table et affiche le nombre de lignes. Votre base locale n'est pas modifiée.

> Vous n'avez que les données de démonstration ? Sautez cette étape et mettez `SEED_DEMO` = `true` sur Render (étape 4) : la démo sera créée automatiquement au premier démarrage. Remettez `false` ensuite.

## 3. E-mails : Brevo

Render gratuit **bloque l'envoi d'e-mails par SMTP**. L'application passe donc par l'**API HTTP** de Brevo (déjà intégrée, rien à coder).

1. Créez un compte sur https://www.brevo.com.
2. **Senders, Domains & Dedicated IPs** → ajoutez et validez votre adresse d'expéditeur.
   Si vous avez un nom de domaine, authentifiez plutôt le domaine : Brevo donne des enregistrements DNS (DKIM, DMARC) à ajouter dans Cloudflare, et vos e-mails n'arrivent plus en spam.
3. **SMTP & API** → onglet **API Keys** → **Generate a new API key** → copiez la clé (`xkeysib-...`).

## 4. API : Render

1. Générez la clé de l'application (en local) :
   ```bash
   docker compose exec backend php artisan key:generate --show
   ```
   Copiez la valeur qui commence par `base64:`.
2. https://dashboard.render.com → **New** → **Blueprint** → choisissez le dépôt `teranga-voyages`.
   Render lit `render.yaml` et prépare le service `teranga-api` (Docker, plan Free, Francfort).
3. Renseignez les valeurs demandées :

| Variable | Valeur |
|---|---|
| `APP_KEY` | la clé `base64:...` de l'étape 1 |
| `APP_URL` | `https://teranga-api.onrender.com` (l'adresse que Render affiche) |
| `FRONTEND_URL` et `CORS_ALLOWED_ORIGINS` | provisoirement `https://teranga-voyages.pages.dev` (corrigé à l'étape 6) |
| `DB_URL` | la chaîne de connexion Neon |
| `BREVO_API_KEY` | la clé Brevo |
| `MAIL_FROM_ADDRESS` | l'adresse validée dans Brevo |
| `WAVE_API_KEY`, `WAVE_WEBHOOK_SECRET` | laisser vide pour l'instant |

4. Cliquez **Apply**. Le premier déploiement prend 5 à 10 minutes.
5. Vérifiez :
   - `https://teranga-api.onrender.com/up` affiche une page verte « Application up » ;
   - `https://teranga-api.onrender.com/api/home` affiche vos voyages en JSON.

> Plan gratuit : l'API s'endort après 15 minutes sans visite ; le premier chargement suivant prend environ une minute. Les images **téléversées** depuis le back-office sont perdues à chaque redéploiement : utilisez plutôt des liens d'images (ou un plan payant plus tard).

## 5. Site : Cloudflare Pages

1. https://dash.cloudflare.com → **Workers & Pages** → **Create** → onglet **Pages** → **Connect to Git** → dépôt `teranga-voyages`.
2. Réglages :

| Champ | Valeur |
|---|---|
| Production branch | `main` |
| Framework preset | `Vite` |
| Root directory | `frontend` |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Variable `VITE_API_URL` | `https://teranga-api.onrender.com/api` |
| Variable `NODE_VERSION` | `20` |

3. **Save and Deploy**. Les fichiers `frontend/public/_redirects` (navigation entre les pages) et `_headers` (en-têtes de sécurité) sont appliqués automatiquement.

## 6. Relier le site et l'API

Sur Render → service `teranga-api` → **Environment** : mettez l'adresse réelle de Cloudflare Pages dans `FRONTEND_URL` et `CORS_ALLOWED_ORIGINS`, puis **Save, rebuild and deploy**.
C'est aussi l'adresse utilisée dans les liens des e-mails (réservation, mot de passe oublié) et pour le logo des e-mails.

Test complet : ouvrez le site, connectez-vous, faites une réservation, puis vérifiez la réception de l'e-mail.

## 7. Cron de maintenance (gratuit, via GitHub)

Render gratuit n'exécute pas de tâches planifiées. Le fichier `.github/workflows/maintenance.yml` appelle l'API toutes les heures : annulation des réservations impayées depuis 48 h et nettoyage des connexions expirées.

GitHub → dépôt → **Settings → Secrets and variables → Actions → New repository secret** :
- `API_URL` = `https://teranga-api.onrender.com`
- `CRON_SECRET` = la valeur générée par Render (onglet **Environment** du service)

Test : onglet **Actions** → **Maintenance horaire** → **Run workflow**.

## 8. Nom de domaine avec Cloudflare (optionnel)

1. Cloudflare → **Add a domain** → suivez les étapes, puis remplacez les serveurs DNS chez votre registrar par ceux de Cloudflare.
2. Cloudflare Pages → votre projet → **Custom domains** → `www.votre-domaine.com` (Cloudflare crée l'enregistrement DNS tout seul).
3. Render → **Settings → Custom Domains** → `api.votre-domaine.com`.
   Dans Cloudflare → **DNS** → enregistrement **CNAME** `api` → `teranga-api.onrender.com`, en mode **DNS only** (nuage gris) pour que Render puisse émettre son certificat.
4. Mettez à jour puis redéployez :
   - Render : `APP_URL`, `FRONTEND_URL`, `CORS_ALLOWED_ORIGINS` ;
   - Cloudflare Pages : `VITE_API_URL` = `https://api.votre-domaine.com/api` ;
   - GitHub : secret `API_URL`.
5. Cloudflare → **SSL/TLS** → mode **Full (strict)**, et **Always Use HTTPS** activé.

## 9. Sécurité : avant d'ouvrir au public

- [ ] **Changer les mots de passe** des comptes de démonstration copiés (`admin@teranga.sn`, `agent@teranga.sn`, `client@teranga.sn` ont le mot de passe `password`) : connexion → **Mon profil**, ou désactivation dans **Utilisateurs**. Créez votre vrai compte administrateur.
- [ ] `APP_DEBUG` = `false` sur Render (déjà dans `render.yaml`).
- [ ] `CORS_ALLOWED_ORIGINS` = uniquement l'adresse du site (jamais `*`).
- [ ] Dépôt GitHub **privé** ; aucun `.env`, `.sql` ou `.pem` dans Git (déjà exclus par `.gitignore`).
- [ ] `PAYMENT_DEFAULT_DRIVER` = `simulation` veut dire que les paiements sont **fictifs**. Passez à `live` seulement avec Wave configuré **et** `WAVE_WEBHOOK_SECRET` renseigné (sans secret, les notifications de paiement sont refusées).
- [ ] Brevo : domaine authentifié (DKIM, DMARC).

Déjà en place dans le code : mots de passe chiffrés, connexions qui expirent après 7 jours, limitation des tentatives (connexion, formulaires), en-têtes de sécurité (API et site), HTTPS forcé, rôles vérifiés côté serveur, webhook Wave signé, URL de maintenance protégée par un secret, « mot de passe oublié » qui ne révèle pas les e-mails inscrits, police d'écriture hébergée sur le site (aucun appel à Google), Dependabot pour les correctifs de sécurité, tests automatiques sur SQLite **et PostgreSQL** à chaque envoi.

## Mettre à jour le site ensuite

```bash
git add .
git commit -m "Description du changement"
git push
```

Render et Cloudflare Pages redéploient automatiquement à chaque `push` sur `main`.
