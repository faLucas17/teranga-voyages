#!/usr/bin/env bash
# --------------------------------------------------------------
# Démarrage du conteneur API : prépare Laravel puis lance la commande.
# --------------------------------------------------------------
set -e
cd /var/www/html

# Le code peut être monté en volume (développement) : on réinstalle si besoin
if [ ! -f vendor/autoload.php ]; then
    echo "→ Installation des dépendances Composer..."
    composer install --no-interaction --prefer-dist
fi

if [ ! -f .env ]; then
    echo "→ Création du fichier .env"
    cp .env.example .env
fi

if ! grep -q "^APP_KEY=base64" .env; then
    echo "→ Génération de la clé d'application"
    php artisan key:generate --force
fi

mkdir -p storage/framework/{cache/data,sessions,views,testing} storage/logs storage/app/public bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache 2>/dev/null || true

# Seul le conteneur principal (php-fpm) s'occupe de la base de données
if [ "$1" = "php-fpm" ] && [ "${RUN_SETUP:-true}" = "true" ]; then
    echo "→ Attente de MySQL..."
    for i in $(seq 1 60); do
        if php -r "try { new PDO('mysql:host=' . getenv('DB_HOST') . ';port=' . (getenv('DB_PORT') ?: 3306), getenv('DB_USERNAME'), getenv('DB_PASSWORD')); exit(0); } catch (Exception \$e) { exit(1); }"; then
            break
        fi
        sleep 2
    done

    php artisan config:clear >/dev/null
    php artisan app:setup

    if [ "${APP_ENV}" = "production" ]; then
        php artisan config:cache
        php artisan route:cache
        php artisan view:cache
    fi
fi

exec "$@"
