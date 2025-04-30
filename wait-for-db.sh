#!/bin/sh

set -e

until nc -z -v -w30 db 5432
do
  echo "Waiting for database connection..."
  sleep 5
done

echo "Database is up - executing command"
npx prisma migrate dev --name init
exec "$@" 