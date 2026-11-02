param(
    [ValidateRange(1024, 65535)]
    [int]$Port = 8776
)
$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '../..')).Path
$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCommand) { throw 'Node.js ab Version 20 fehlt.' }
if (-not (Test-Path -LiteralPath (Join-Path $projectRoot 'node_modules/ws'))) {
    throw 'Entwicklungsabhängigkeiten fehlen. Aus PROJEKT zuerst pnpm install --frozen-lockfile ausführen.'
}
$previousPort = $env:MISCHWERK_EMULATOR_PORT
$env:MISCHWERK_EMULATOR_PORT = [string]$Port
Push-Location -LiteralPath $projectRoot
try {
    Write-Host "Testlabor im Browser: http://127.0.0.1:$Port"
    Write-Host 'Beenden mit Strg+C. Alle Daten und Fehlerprofile sind ausschließlich lokal.'
    & $nodeCommand.Source (Join-Path $PSScriptRoot 'server.cjs')
} finally {
    Pop-Location
    $env:MISCHWERK_EMULATOR_PORT = $previousPort
}
