# syntax=docker/dockerfile:1

FROM php:8.5-fpm-alpine

RUN apk add --no-cache postgresql-dev nginx \
    && docker-php-ext-install pdo_pgsql
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html
COPY api/ .

RUN echo "APP_ENV=prod" > .env \
    && composer install --no-interaction --no-dev --optimize-autoloader --no-scripts \
    && composer dump-env prod --empty

COPY api/nginx.conf /etc/nginx/nginx.conf

EXPOSE 8080

CMD ["sh", "-c", "php bin/console cache:clear && php-fpm & nginx -g 'daemon off;'"]
