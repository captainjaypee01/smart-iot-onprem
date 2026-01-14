FROM php:8.5-cli-alpine

# System deps needed to compile PHP extensions
RUN apk add --no-cache \
    bash curl git unzip \
    postgresql-dev \
    oniguruma-dev \
    libzip-dev \
    $PHPIZE_DEPS \
  && docker-php-ext-install pdo_pgsql pgsql mbstring zip \
  && pecl install redis \
  && docker-php-ext-enable redis \
  && apk del $PHPIZE_DEPS

WORKDIR /app
