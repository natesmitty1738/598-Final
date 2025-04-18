#!/bin/bash

# Run the migration SQL directly against the database
docker compose exec db psql -U postgres -d merchx -c "ALTER TABLE \"User\" ADD COLUMN \"permissions\" \"Permission\"[] DEFAULT '{}';"

# Force Prisma to recognize the schema changes
docker compose exec app npx prisma db pull
docker compose exec app npx prisma generate

# Restart the application container
docker compose restart app 