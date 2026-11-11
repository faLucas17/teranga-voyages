# Déploiement en ligne de Teranga Voyages

Architecture gratuite (au démarrage) :

| Rôle | Service | Adresse type |
|---|---|---|
| Frontend React | **Cloudflare Pages** | `https://teranga-voyages.pages.dev` |
| API Laravel | **Render** (Docker, plan Free) | `https://teranga-api.onrender.com` |
| Base MySQL | **Aiven** (plan Free, 1 Go) | `mysql-xxxx.aivencloud.com` |
| E-mails | **Brevo** (API HTTP, 300 e-mails/jour gratuits) | expéditeur validé |
| Nom de domaine + DNS (optionnel) | **Cloudflare** | `www.votre-domaine.com`, `api.votre-domaine.com` |
| Code + CI + cron | **GitHub** | `github.com/faLucas17/teranga-voyages` |

Ordre conseillé : 1. Base → 2. Brevo → 3. Render → 4. Cloudflare Pages → 5. Retour sur Render (URL du frontend) → 6. Cron GitHub → 7. Sécurité finale.

---

## 0. Sauvegarder les données locales

Vos voyages, comptes et réservations sont dans le MySQL de Docker. Exportez-les :

```bash
cd ~/teranga-voyages
docker compose exec -T mysql mysqldump -uroot -proot --set-gtid-purged=OFF --no-tablespaces --single-transaction teranga > teranga.sql
```

`teranga.sql` n'est jamais envoyé sur GitHub (il est dans `.gitignore`).

## 1. Base de données : Aiven MySQL

1. Créez un compte sur https://aiven.io → **Create service** → **MySQL** → plan **Free**.
2. Onglet **Overview** : notez *Host*, *Port*, *User* (`avnadmin`), *Password*, base `defaultdb`, et téléchargez le **CA certificate** (`ca.pem`).
3. Importez vos données (le client MySQL du conteneur Docker suffit) :

```bash
docker compose exec -T mysql mysql -h HOST -P PORT -u avnadmin -pMOT_DE_PASSE --ssl-mode=REQUIRED defaultdb < teranga.sql
```

> Aiven met en pause un service gratuit inactif ; un clic sur **Power on** le relance.

## 2. E-mails : Brevo

Render (gratuit) **bloque les ports SMTP** : l'application envoie donc les e-mails par l'**API HTTP** de Brevo (transport `brevo` déjà intégré).

1. Créez un compte sur https://www.brevo.com.
2. **Senders, Domains & Dedicated IPs** → ajoutez et validez votre adresse d'expéditeur (ou mieux, votre domaine : Brevo donne des enregistrements DNS DKIM/DMARC à ajouter dans Cloudflare).
3. **SMTP & API** → onglet **API Keys** → **Generate a new API key** → copiez la clé (`xkeysib-...`).

## 3. API : Render

1. Générez la clé de l'application (en local) :
   ```bash
   docker compose exec backend php artisan key:generate --show
   ```
2. https://dashboard.render.com → **New** → **Blueprint** → choisissez le dépôt `teranga-voyages`. Render lit `render.yaml` et crée le service `teranga-api`.
3. Renseignez les valeurs demandées :

| Variable | Valeur |
|---|---|
| `APP_KEY` | la clé `base64:...` de l'étape 1 |
| `APP_URL` | `https://teranga-api.onrender.com` |
| `FRONTEND_URL` et `CORS_ALLOWED_ORIGINS` | provisoirement `https://teranga-voyages.pages.dev` (à ajuster à l'étape 5) |
| `DB_HOST`, `DB_PORT`, `DB_PASSWORD` | valeurs Aiven |
| `DB_CA_CERT` | tout le contenu de `ca.pem` (de `-----BEGIN CERTIFICATE-----` à `-----END CERTIFICATE-----`) |
| `BREVO_API_KEY` | la clé Brevo |
| `MAIL_FROM_ADDRESS` | l'adresse validée dans Brevo |
| `WAVE_API_KEY`, `WAVE_WEBHOOK_SECRET` | laisser vide pour l'instant |

4. Vérifiez : `https://teranga-api.onrender.com/up` → page « Application up », puis `/api/home` → vos voyages en JSON.

> Plan gratuit : l'API s'endort après 15 min sans visite (premier chargement ~1 min). Les images **téléversées** sont perdues à chaque redéploiement : utilisez des URL d'images, ou passez à un plan payant / stockage Cloudflare R2.

## 4. Frontend : Cloudflare Pages

1. https://dash.cloudflare.com → **Workers & Pages** → **Create** → **Pages** → **Connect to Git** → dépôt `teranga-voyages`.
2. Réglages de build :

| Champ | Valeur |
|---|---|
| Framework preset | Vite (ou None) |
| Root directory | `frontend` |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Variable `VITE_API_URL` | `https://teranga-api.onrender.com/api` |
| Variable `NODE_VERSION` | `20` |

3. Déployez. Les fichiers `frontend/public/_redirects` (navigation React) et `_headers` (en-têtes de sécurité, CSP) sont appliqués automatiquement.

## 5. Relier les deux

Sur Render, mettez l'URL réelle de Cloudflare Pages dans `FRONTEND_URL` et `CORS_ALLOWED_ORIGINS`, puis **Manual Deploy**. Les liens des e-mails (réservation, mot de passe oublié) pointent vers cette adresse.

## 6. Nom de domaine avec Cloudflare (optionnel)

1. Ajoutez votre domaine dans Cloudflare et changez les serveurs DNS chez votre registrar.
2. Cloudflare Pages → **Custom domains** → `www.votre-domaine.com`.
3. Render → **Settings → Custom Domains** → `api.votre-domaine.com`, puis dans Cloudflare un enregistrement **CNAME** `api` → `teranga-api.onrender.com` (**DNS only**, nuage gris, le temps que Render émette le certificat).
4. Mettez à jour `APP_URL`, `FRONTEND_URL`, `CORS_ALLOWED_ORIGINS` (Render) et `VITE_API_URL` (Cloudflare Pages), puis redéployez les deux.
5. Cloudflare → **SSL/TLS** → mode **Full (strict)** ; **Always Use HTTPS** activé.

## 7. Cron de maintenance (gratuit, via GitHub)

Render gratuit n'exécute pas de tâches planifiées. Le workflow `.github/workflows/maintenance.yml` appelle l'API chaque heure (annulation des réservations impayées depuis 48 h, purge des jetons expirés).

GitHub → dépôt → **Settings → Secrets and variables → Actions → New repository secret** :
- `API_URL` = `https://teranga-api.onrender.com`
- `CRON_SECRET` = la valeur générée par Render (onglet **Environment** du service)

Test : onglet **Actions** → *Maintenance horaire* → **Run workflow**.

## 8. Sécurité : à faire avant d'ouvrir au public

- [ ] **Changer les mots de passe** des comptes importés (`admin@teranga.sn`, `agent@teranga.sn`, `client@teranga.sn` ont `password`) : connectez-vous → **Mon profil** → changer le mot de passe, ou désactivez-les dans **Utilisateurs**. Créez votre vrai compte admin.
- [ ] `APP_DEBUG=false` sur Render (déjà dans `render.yaml`).
- [ ] `CORS_ALLOWED_ORIGINS` = uniquement l'adresse du frontend (jamais `*`).
- [ ] Dépôt GitHub **privé** ; aucun `.env`, `.sql` ou `.pem` dans Git (déjà exclus par `.gitignore`).
- [ ] `PAYMENT_DEFAULT_DRIVER=simulation` signifie que les paiements sont **fictifs** : à ne pas présenter comme réels. Passez à `live` seulement avec Wave configuré **et** `WAVE_WEBHOOK_SECRET` renseigné (sans secret, les webhooks sont refusés).
- [ ] Brevo : domaine authentifié (DKIM/DMARC) pour éviter les spams.

Déjà en place dans le code : mots de passe hachés, jetons qui expirent après 7 jours, limitation des tentatives (connexion, formulaires), en-têtes de sécurité (API et site), HTTPS forcé, contrôle des rôles côté serveur, webhook Wave signé, URL de cron protégée par secret, mot de passe oublié sans fuite des e-mails inscrits, Dependabot pour les mises à jour de sécurité, tests automatiques (CI) à chaque envoi.

## Mettre à jour le site ensuite

```bash
git add .
git commit -m "Description du changement"
git push
```

Render et Cloudflare Pages redéploient automatiquement à chaque `push` sur `main`.
