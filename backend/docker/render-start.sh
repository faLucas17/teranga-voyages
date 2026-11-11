#!/usr/bin/env bash
# --------------------------------------------------------------
# Démarrage sur Render : port, base de données, caches, puis Apache.
# --------------------------------------------------------------
set -e
cd /var/www/html

PORT="${PORT:-10000}"
sed -i "s/^Listen .*/Listen ${PORT}/" /etc/apache2/ports.conf
sed -i "s/<VirtualHost \*:[0-9]*>/<VirtualHost *:${PORT}>/" /etc/apache2/sites-available/000-default.conf

if [ -z "${APP_KEY}" ]; then
    echo "ERREUR : la variable APP_KEY n'est pas définie dans Render." >&2
    exit 1
fi

# Certificat SSL de la base (Aiven) : collé dans la variable DB_CA_CERT sur Render
if [ -n "${DB_CA_CERT}" ]; then
    printf '%s\n' "${DB_CA_CERT}" > /tmp/db-ca.pem
    export MYSQL_ATTR_SSL_CA=/tmp/db-ca.pem
elif [ -f /etc/secrets/ca.pem ]; then
    export MYSQL_ATTR_SSL_CA=/etc/secrets/ca.pem
fi

php artisan config:clear
php artisan app:setup            # migrations (+ données de démo seulement si SEED_DEMO=true et base vide)
php artisan storage:link 2>/dev/null || true

php artisan config:cache
php artisan route:cache
php artisan view:cache

chown -R www-data:www-data storage bootstrap/cache

exec apache2-foreground
