#!/bin/bash

echo "Running migrations"
php artisan migrate --force

echo "Starting supervisor"
exec /usr/bin/supervisord -c /etc/supervisor/supervisord.conf
