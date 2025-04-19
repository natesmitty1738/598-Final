# PowerShell script to fix the "table does not exist" error

Write-Host "Database Table Recovery Script" -ForegroundColor Cyan
Write-Host "--------------------------------" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
try {
    docker ps -q > $null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
        exit 1
    }
}
catch {
    Write-Host "ERROR: Docker is not installed or not running." -ForegroundColor Red
    exit 1
}

# Check if the app containers are running
$appContainer = docker ps -q --filter "name=app"
if (-not $appContainer) {
    Write-Host "Starting Docker containers..." -ForegroundColor Yellow
    docker compose up -d
    Start-Sleep -Seconds 5
    $appContainer = docker ps -q --filter "name=app"
    if (-not $appContainer) {
        Write-Host "ERROR: Failed to start Docker containers." -ForegroundColor Red
        exit 1
    }
}

Write-Host "1. Applying SQL migration directly to the database..." -ForegroundColor Yellow

# Copy the migration SQL to the database container
try {
    # Check if we have a migration SQL file
    if (Test-Path -Path "prisma/migrations/20250419000000_init/migration.sql") {
        # Copy the migration file to the database container
        docker cp prisma/migrations/20250419000000_init/migration.sql 598-final-db-1:/tmp/
        # Execute the SQL file
        docker exec 598-final-db-1 psql -U postgres -d merchx -f /tmp/migration.sql
        Write-Host "   SQL migration applied successfully!" -ForegroundColor Green
    } else {
        Write-Host "   Migration SQL file not found. Skipping direct SQL application." -ForegroundColor Yellow
    }
} catch {
    Write-Host "   Failed to apply SQL migration: $_" -ForegroundColor Red
}

Write-Host "2. Restarting the app container..." -ForegroundColor Yellow
docker restart 598-final-app-1
Write-Host "   App container restarted!" -ForegroundColor Green

Write-Host ""
Write-Host "Database recovery process completed." -ForegroundColor Green
Write-Host "Your application should now be working at http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "If you still see errors, try stopping all containers and running:" -ForegroundColor Yellow
Write-Host "docker compose down" -ForegroundColor White
Write-Host "docker compose up -d" -ForegroundColor White 