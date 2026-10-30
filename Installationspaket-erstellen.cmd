@echo off
setlocal
cd /d "%~dp0PROJEKT"
set "MW_BUILD_NODE=node"
where node >nul 2>nul
if errorlevel 1 set "MW_BUILD_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if not "%MW_BUILD_NODE%"=="node" if not exist "%MW_BUILD_NODE%" (
  echo Bitte Node.js ab Version 20 installieren.
  pause
  exit /b 1
)
"%MW_BUILD_NODE%" tools\build-install.cjs
if errorlevel 1 (
  echo Paket konnte nicht erstellt werden. Fehler oben pruefen.
  pause
  exit /b 1
)
echo Uploadordner: %~dp0UPLOAD\MischWerk
echo ZIP und Pruefsummen: %~dp0ANLEITUNGEN\Paket
echo Es wurde nichts auf den Knuddels-Server hochgeladen.
pause
