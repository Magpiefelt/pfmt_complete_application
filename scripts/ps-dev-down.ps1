# Requires PowerShell 5.0 or higher
param()

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$ProjectRoot = Join-Path $ScriptDir ".."
$ComposeDir = Join-Path $ProjectRoot "docker"

Set-Location -Path $ComposeDir
docker compose -f docker-compose.dev.yml down