@echo off
REM One-click launcher for Windows
REM Usage: double-click run.bat

setlocal enabledelayedexpansion
set SCRIPT_DIR=%~dp0
set ROOT=%SCRIPT_DIR%

cd /d "%ROOT%" || exit /b 1

if not exist "%ROOT%\logs" mkdir "%ROOT%\logs"
set NODE_ENV=production

REM Run and append logs
node "%ROOT%\scripts\run.mjs" >> "%ROOT%\logs\app.log" 2>&1
