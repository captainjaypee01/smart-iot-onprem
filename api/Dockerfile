# api/Dockerfile
# Multi-stage: base → dev (Xdebug + dev deps) → production (hardened)

# ── base: PHP + all extensions ────────────────────────────────────────────────
FROM php:8.4-cli-alpine AS base

# 1. System libs needed to compile PHP extensions
#    $PHPIZE_DEPS = autoconf, g++, gcc, make, etc. (needed for pecl)
RUN apk add --no-cache \
        bash \
        curl \
        git \
        unzip \
        # pdo_pgsql / pgsql
        libpq-dev \
        postgresql-dev \
        # zip
        libzip-dev \
        zip \
        # mbstring
        oniguruma-dev \
        # intl
        icu-dev \
        icu-libs \
        # pcntl / bcmath / opcache ship with PHP — no extra lib needed
    && apk add --no-cache --virtual .phpize-deps $PHPIZE_DEPS

# 2. Install extensions that need compilation
RUN docker-php-ext-configure intl \
 && docker-php-ext-install -j$(nproc) \
        pdo \
        pdo_pgsql \
        pgsql \
        zip \
        mbstring \
        bcmath \
        intl \
        opcache \
        pcntl

# 3. Redis via PECL (needs phpize-deps), then clean up build tools
RUN pecl install redis \
 && docker-php-ext-enable redis \
 && apk del .phpize-deps \
 && rm -rf /tmp/pear

# 4. Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app

# 5. Install production PHP deps (no dev, no scripts yet)
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist --no-interaction

# 6. Copy source and finish autoloader
COPY . .
RUN composer dump-autoload --optimize \
 && php artisan package:discover --ansi || true

# 7. Permissions
RUN chown -R www-data:www-data storage bootstrap/cache \
 && chmod -R 775 storage bootstrap/cache

EXPOSE 8000
CMD ["sh", "-lc", "php artisan serve --host=0.0.0.0 --port=8000"]

# ── dev: entrypoint auto-migrates and installs dev deps on every start ────────
FROM base AS dev

# Copy entrypoint before the bind-mount shadows /app, so it always exists
COPY docker-entrypoint.dev.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]

# ── production: hardened, no Composer, opcache tuned ─────────────────────────
FROM base AS production

# Opcache tuning for production
RUN { \
        echo "opcache.enable=1"; \
        echo "opcache.memory_consumption=256"; \
        echo "opcache.max_accelerated_files=20000"; \
        echo "opcache.validate_timestamps=0"; \
        echo "opcache.revalidate_freq=0"; \
        echo "opcache.fast_shutdown=1"; \
    } > /usr/local/etc/php/conf.d/opcache-prod.ini \
 && { \
        echo "expose_php=Off"; \
        echo "display_errors=Off"; \
        echo "log_errors=On"; \
        echo "error_log=/dev/stderr"; \
    } > /usr/local/etc/php/conf.d/security.ini

# Remove Composer — not needed at runtime
RUN rm /usr/bin/composer

USER www-data
CMD ["sh", "-lc", "php artisan serve --host=0.0.0.0 --port=8000"]