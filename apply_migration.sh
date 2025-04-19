#!/bin/bash

echo "WARNING: This will delete your PostgreSQL database and all data inside it!"
echo "Press Ctrl+C now to cancel, or Enter to continue..."
read
echo "Stopping all containers..."
docker compose down
echo "Deleting PostgreSQL database volumes..."
docker volume rm $(docker volume ls -q | grep postgres) 2>/dev/null || echo "No PostgreSQL volumes found"
echo "Rebuilding Docker images..."
docker compose build
echo "Starting containers..."
docker compose up -d

echo "environment has been reset with a fresh database."