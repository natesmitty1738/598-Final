#!/bin/sh

echo "Waiting for PostgreSQL to start..."
until nc -z db 5432; do
  sleep 1
done
echo "PostgreSQL started"

echo "Starting the application..."
exec "$@" 