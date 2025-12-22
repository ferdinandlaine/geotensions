#!/bin/sh
set -e

# Install composer dependencies
composer install --no-interaction

# Clear Symfony cache
php bin/console cache:clear

# Execute the main command (php-fpm)
exec "$@"
