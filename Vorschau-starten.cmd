@echo off
setlocal
cd /d "%~dp0PROJEKT"
set "MW_NODE=node"
where node >nul 2>nul
if errorlevel 1 set "MW_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if not "%MW_NODE%"=="node" if not exist "%MW_NODE%" (
  echo Bitte Node.js installieren, danach diese Datei erneut starten.
  pause
  exit /b 1
)
echo Vorschau im Browser: http://127.0.0.1:8765
echo Fenster geoeffnet lassen. Beenden mit Strg+C.
"%MW_NODE%" tools\preview.cjs
pause
