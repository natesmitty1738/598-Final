# PowerShell

Write-Host "WARNING: This will delete your PostgreSQL database and all data inside it!" -ForegroundColor Red
Write-Host "Press Ctrl+C now to cancel, or Enter to continue..." -ForegroundColor Yellow
Read-Host
Write-Host "Stopping all containers..." -ForegroundColor Cyan
docker compose down
Write-Host "Deleting PostgreSQL database volumes..." -ForegroundColor Cyan
$postgresVolumes = docker volume ls -q | Select-String "postgres"
if ($postgresVolumes) {
    $postgresVolumes | ForEach-Object { docker volume rm $_ }
} else {
    Write-Host "No PostgreSQL volumes found"
}
Write-Host "Rebuilding Docker images..." -ForegroundColor Cyan
docker compose build
Write-Host "Starting containers..." -ForegroundColor Cyan
docker compose up -d

Write-Host "environment has been reset with a fresh database." -ForegroundColor Green 