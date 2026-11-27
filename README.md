# ✈️ Teranga Voyages

Application web complète d'agence de voyage : site de vente en ligne, espace client et back-office.
**Laravel 12 (API) · React 18 (Vite + Tailwind) · MySQL 8 · Docker**

![Logo](branding/logo-teranga.png)

---

## 1. Ce que contient le projet

```
teranga-voyages/
├── backend/            API Laravel (modèles, contrôleurs, services, migrations, seeders, tests)
├── frontend/           Application React (site public, espace client, back-office) + Nginx
├── docs/
│   ├── Cahier_des_charges_Teranga_Voyages.pdf   ← cahier des charges complet
│   ├── CAHIER_DES_CHARGES.md                    ← même contenu, modifiable
│   └── uml/            10 diagrammes UML (.puml sources + .png)
├── branding/           Logo officiel (couleur, blanc, icône) et charte couleurs
├── docker-compose.yml        Environnement de développement
├── docker-compose.prod.yml   Environnement de production
└── Makefile            Raccourcis de commandes
```

**Fonctionnalités principales**

| Site public | Espace client | Back-office |
|---|---|---|
| Accueil + moteur de recherche | Tunnel de réservation avec devis en direct | Tableau de bord (CA, graphiques, alertes) |
| Voyages (séjours, circuits, Omra…) avec filtres | Paiement Wave / Orange Money / carte / virement / espèces | CRUD voyages, destinations, hôtels, vols |
| Destinations, vols, hôtels | Historique, bon imprimable (PDF) | Réservations : statuts, notes, encaissement, export CSV |
| Demande de visa, contact, newsletter | Annulation, favoris, avis | Paiements à valider, codes promo |
| Bouton WhatsApp | Suivi des demandes de visa, profil | Visas, messages, avis, newsletter, utilisateurs, paramètres |

---

## 2. Lancer l'application (méthode recommandée : Docker)

### Prérequis
- **Docker Desktop** (Windows / Mac) ou Docker Engine + Compose (Linux) : https://www.docker.com/products/docker-desktop
- Rien d'autre : PHP, Composer, Node et MySQL tournent dans les conteneurs.

### Démarrage
```bash
# 1. Décompressez le zip puis ouvrez un terminal dans le dossier
cd teranga-voyages

# 2. Construisez et démarrez tout (la 1re fois : 5 à 10 minutes)
docker compose up -d --build

# 3. Suivez l'installation (migrations + données de démo), Ctrl+C pour quitter l'affichage
docker compose logs -f backend
```
Attendez le message **« Teranga Voyages est prêt. »** puis ouvrez :

| Service | Adresse |
|---|---|
| 🌍 Site + back-office | http://localhost:8190 |
| 🗄️ phpMyAdmin (base de données) | http://localhost:8191 |
| 📧 Mailpit (e-mails envoyés par l'appli) | http://localhost:8126 |

### Comptes de démonstration (mot de passe : `password`)
| Rôle | E-mail | Accès |
|---|---|---|
| Administrateur | `admin@teranga.sn` | Tout, dont utilisateurs et paramètres |
| Agent | `agent@teranga.sn` | Back-office (sauf utilisateurs/paramètres) |
| Client | `client@teranga.sn` | Espace client |

Codes promo de démo : `TERANGA10` (-10 %) et `TABASKI50` (-50 000 FCFA dès 500 000 FCFA).

> Les paiements sont en **mode simulation** : aucun argent réel ne circule. Voir section 6 pour activer Wave.

---

## 3. Commandes utiles

| Action | Commande | Avec `make` |
|---|---|---|
| Démarrer | `docker compose up -d` | `make up` |
| Arrêter | `docker compose down` | `make down` |
| Voir les logs | `docker compose logs -f backend` | `make logs` |
| Lancer les tests | `docker compose exec backend php artisan test` | `make test` |
| Remettre la base à zéro (+ démo) | `docker compose exec backend php artisan app:setup --fresh` | `make fresh` |
| Créer un administrateur | `docker compose exec backend php artisan app:admin moi@agence.sn --name="Mon Nom"` | |
| Terminal dans le conteneur PHP | `docker compose exec backend bash` | `make shell` |
| Frontend avec rechargement à chaud | `docker compose --profile dev up -d frontend-dev` → http://localhost:5183 | `make dev` |
| Tout supprimer (base comprise) | `docker compose down -v` | |

---

## 4. Modifier l'application

### Backend (Laravel) — dossier `backend/`
Le dossier est monté dans le conteneur : **toute modification d'un fichier PHP est prise en compte immédiatement.**

| Je veux… | Fichier(s) |
|---|---|
| Ajouter une route d'API | `routes/api.php` |
| Changer une règle de calcul de prix / de places | `app/Services/BookingService.php` |
| Changer la logique de paiement | `app/Services/Payments/` |
| Ajouter un champ à une table | Nouvelle migration : `docker compose exec backend php artisan make:migration add_xxx_to_yyy` puis `php artisan migrate` |
| Modifier les données de démo | `database/seeders/DatabaseSeeder.php` puis `make fresh` |
| Changer l'e-mail envoyé aux clients | `resources/views/emails/booking.blade.php` |
| Paramètres de l'agence par défaut | `config/agency.php` et `.env` |

### Frontend (React) — dossier `frontend/`
- Lancez `make dev` (ou `docker compose --profile dev up -d frontend-dev`) et travaillez sur **http://localhost:5183** : chaque sauvegarde recharge la page.
- Sans Docker : `cd frontend && npm install && npm run dev` (l'API doit tourner sur le port 8190).
- Après vos changements, reconstruisez la version servie sur le port 8190 : `docker compose up -d --build web`.

| Je veux… | Fichier(s) |
|---|---|
| Changer les couleurs | `frontend/tailwind.config.js` (palettes `bic` et `sky`) |
| Changer le logo | `frontend/public/logo-teranga.png` (fond clair), `logo-teranga-white.png` (fond bleu), `favicon.png`, `icon-512.png` |
| Modifier une page | `frontend/src/pages/…` |
| Ajouter une page | Créer le composant puis l'ajouter dans `frontend/src/App.jsx` |
| Ajouter un écran CRUD au back-office | Copier un bloc de `frontend/src/pages/admin/CatalogPages.jsx` (composant générique `ResourcePage`) |
| Menu du back-office | `frontend/src/layouts/AdminLayout.jsx` |

### Changer de marque (revente à une autre agence)
1. Back-office → **Paramètres** : nom, slogan, téléphone, WhatsApp, adresse, réseaux sociaux, coordonnées bancaires.
2. `.env` : `AGENCY_NAME`, `AGENCY_EMAIL`, `BOOKING_PREFIX` (préfixe des références, ex. `TV-2610-XXXX`).
3. Logo dans `frontend/public/` et couleurs dans `tailwind.config.js`, puis `docker compose up -d --build web`.

---

## 5. Mettre en ligne (production)

> **Hébergement gratuit recommandé : Render (API) + Cloudflare Pages (site) + Neon (PostgreSQL) + Brevo (e-mails).**
> Guide pas à pas : [`docs/DEPLOIEMENT.md`](docs/DEPLOIEMENT.md). La suite de cette section décrit l'autre option : un VPS avec Docker.

1. Louez un **VPS Linux** (2 Go RAM minimum : OVH, Hetzner, DigitalOcean, Contabo…) et installez Docker.
2. Pointez votre nom de domaine (ex. `teranga-voyages.sn`) vers l'IP du serveur.
3. Copiez le projet sur le serveur, puis :
   ```bash
   cp .env.prod.example .env.prod
   nano .env.prod             # remplissez URL, mots de passe, SMTP, APP_KEY
   docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
   docker compose -f docker-compose.prod.yml exec backend php artisan app:admin vous@agence.sn --name="Votre Nom"
   ```
   Générer `APP_KEY` : `docker run --rm php:8.3-cli php -r "echo 'base64:'.base64_encode(random_bytes(32)).PHP_EOL;"`
4. **HTTPS** obligatoire : placez [Caddy](https://caddyserver.com) devant (certificat automatique) avec un `Caddyfile` minimal :
   ```
   teranga-voyages.sn {
       reverse_proxy localhost:80
   }
   ```
   (dans ce cas mettez `HTTP_PORT=8080` dans `.env.prod` et `reverse_proxy localhost:8190`).
5. **Sauvegardes** de la base, par exemple chaque nuit via cron :
   ```bash
   docker compose -f docker-compose.prod.yml exec -T mysql mysqldump -uroot -p"$DB_ROOT_PASSWORD" teranga > backup-$(date +%F).sql
   ```

---

## 6. Paiements réels

| Moyen | État | Activation |
|---|---|---|
| Simulation | ✅ prêt | Par défaut (`PAYMENT_DEFAULT_DRIVER=simulation`) |
| Espèces / virement | ✅ prêt | Le paiement reste « en attente » ; un agent le valide dans **Paiements** |
| Wave | 🟡 intégré, à tester avec votre compte | Compte **Wave Business** → `WAVE_API_KEY`, `WAVE_WEBHOOK_SECRET`, `PAYMENT_DEFAULT_DRIVER=live`. Déclarez le webhook `https://votre-domaine/api/payments/webhook/wave`. Vérifiez les champs dans la documentation officielle Wave avant la mise en production. |
| Orange Money, carte (Stripe, PayDunya…) | 🔲 à brancher | Créez une classe dans `backend/app/Services/Payments/` implémentant `PaymentGateway` (modèle : `WaveGateway.php`) et ajoutez-la dans `PaymentManager::gateway()`. |

---

## 7. Sans Docker (pour information)
Prérequis : PHP 8.2+, Composer, Node 20+, MySQL 8.
```bash
cd backend && cp .env.example .env    # mettez DB_HOST=127.0.0.1 et vos identifiants MySQL
composer install && php artisan key:generate && php artisan app:setup && php artisan serve --port=8000
cd ../frontend && cp .env.example .env # mettez VITE_PROXY_TARGET=http://localhost:8000
npm install && npm run dev            # http://localhost:5183
```

---

## 8. Documentation
- `docs/Cahier_des_charges_Teranga_Voyages.pdf` : contexte, acteurs, besoins fonctionnels et non fonctionnels, règles de gestion, API, planning, recette, modèle commercial.
- `docs/uml/` : cas d'utilisation, classes, MLD, séquences (réservation/paiement, authentification), activité, états, composants, déploiement, navigation frontend. Modifiez les `.puml` avec l'extension **PlantUML** de VS Code.

## 9. Dépannage
| Problème | Solution |
|---|---|
| Un port est déjà utilisé par un autre projet | Créez un fichier `.env` à la racine avec par ex. `WEB_PORT=8290` et `PMA_PORT=8291`, puis `docker compose up -d` |
| Page blanche ou erreur 502 juste après le démarrage | L'installation n'est pas finie : `docker compose logs -f backend` |
| « SQLSTATE… Connection refused » | MySQL démarre encore, patientez 30 s puis `docker compose restart backend` |
| Je veux repartir de zéro | `docker compose down -v && docker compose up -d --build` |
| Les images de démo ne s'affichent pas | Elles viennent d'internet (picsum.photos) ; remplacez-les par vos photos depuis le back-office |
