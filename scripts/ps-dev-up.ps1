# Requires PowerShell 5.0 or higher
param()

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$ProjectRoot = Join-Path $ScriptDir ".."
$ComposeDir = Join-Path $ProjectRoot "docker"

# Copy .env.example to .env if .env does not exist
$envFile = Join-Path $ComposeDir ".env"
$envExample = Join-Path $ComposeDir ".env.example"
if (-not (Test-Path $envFile) -and (Test-Path $envExample)) {
    Copy-Item $envExample $envFile
    Write-Host "Copied default .env from .env.example"
}

Set-Location -Path $ComposeDir
docker compose -f docker-compose.dev.yml up --build