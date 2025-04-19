#!/bin/bash
set -e

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
while ! nc -z db 5432; do
  sleep 1
done
echo "PostgreSQL is ready!"

# Check if User table exists
TABLE_EXISTS=$(psql -h db -U ${POSTGRES_USER:-postgres} -d merchx -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'User')")

# Trim whitespace
TABLE_EXISTS=$(echo $TABLE_EXISTS | xargs)

echo "Checking if database is initialized... Table exists: $TABLE_EXISTS"

# If tables don't exist, run migrations
if [ "$TABLE_EXISTS" = "f" ]; then
  echo "Database tables don't exist. Attempting to fix..."
  
  # First try Prisma migrate deploy
  echo "Attempting to run prisma migrate deploy..."
  npx prisma migrate deploy || true
  
  # Check if tables now exist
  TABLE_EXISTS_AFTER=$(psql -h db -U ${POSTGRES_USER:-postgres} -d merchx -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'User')")
  TABLE_EXISTS_AFTER=$(echo $TABLE_EXISTS_AFTER | xargs)
  
  # If tables still don't exist, apply SQL directly
  if [ "$TABLE_EXISTS_AFTER" = "f" ]; then
    echo "Migration failed or not found. Checking for migration SQL files..."
    
    # Find migration files
    MIGRATION_SQL=$(find /app/prisma/migrations -name "migration.sql" | head -1)
    
    if [ -n "$MIGRATION_SQL" ]; then
      echo "Found migration SQL file: $MIGRATION_SQL"
      echo "Applying SQL directly to database..."
      psql -h db -U ${POSTGRES_USER:-postgres} -d merchx -f "$MIGRATION_SQL"
      echo "SQL applied successfully!"
    else
      echo "No migration SQL files found. Creating tables from schema..."
      # Generate migration SQL from schema
      npx prisma migrate dev --name init_recovery --create-only
      # Find the newly created migration SQL
      MIGRATION_SQL=$(find /app/prisma/migrations -name "migration.sql" | head -1)
      
      if [ -n "$MIGRATION_SQL" ]; then
        echo "Applying newly created migration SQL..."
        psql -h db -U ${POSTGRES_USER:-postgres} -d merchx -f "$MIGRATION_SQL"
        echo "SQL applied successfully!"
      else
        echo "Failed to create or find migration SQL. Database might not be initialized properly."
      fi
    fi
    
    # Verify tables were created
    TABLE_EXISTS_FINAL=$(psql -h db -U ${POSTGRES_USER:-postgres} -d merchx -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'User')")
    TABLE_EXISTS_FINAL=$(echo $TABLE_EXISTS_FINAL | xargs)
    
    if [ "$TABLE_EXISTS_FINAL" = "t" ]; then
      echo "Database tables created successfully!"
    else
      echo "ERROR: Failed to create database tables. Application might not work correctly!"
    fi
  else
    echo "Migration completed successfully!"
  fi
  
  # Generate Prisma client
  echo "Generating Prisma client..."
  npx prisma generate
else
  echo "Database is already initialized. Skipping migrations."
fi

# Execute the provided command (likely npm start)
echo "Starting the application..."
exec "$@" 