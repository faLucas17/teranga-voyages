# --------------------------------------------------------------
# Teranga Voyages - API Laravel (PHP-FPM 8.3)
# --------------------------------------------------------------
FROM php:8.3-fpm-alpine

ARG APP_ENV=local

RUN apk add --no-cache \
        bash git unzip curl \
        icu-dev libzip-dev oniguruma-dev \
        libpng-dev libjpeg-turbo-dev freetype-dev libwebp-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg --with-webp \
    && docker-php-ext-install -j"$(nproc)" pdo_mysql mbstring intl zip gd bcmath opcache pcntl exif

# PostgreSQL (Neon) : couche séparée pour garder en cache l'étape précédente, plus longue
RUN apk add --no-cache libpq-dev && docker-php-ext-install pdo_pgsql

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
COPY docker/php.ini /usr/local/etc/php/conf.d/zz-teranga.ini

WORKDIR /var/www/html

# Dépendances d'abord (meilleur cache Docker)
COPY composer.json composer.lock* ./
RUN if [ "$APP_ENV" = "production" ]; then \
        composer install --no-dev --no-interaction --prefer-dist --no-scripts --no-autoloader; \
    else \
        composer install --no-interaction --prefer-dist --no-scripts --no-autoloader; \
    fi

COPY . .
RUN composer dump-autoload --optimize \
    && mkdir -p storage/framework/cache/data storage/framework/sessions storage/framework/views \
                storage/framework/testing storage/logs storage/app/public bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache

COPY docker/entrypoint.sh /usr/local/bin/entrypoint
RUN chmod +x /usr/local/bin/entrypoint

EXPOSE 9000
ENTRYPOINT ["entrypoint"]
CMD ["php-fpm"]
