@echo off
REM One-click launcher for Windows
REM Usage: double-click run.bat

setlocal enabledelayedexpansion
set SCRIPT_DIR=%~dp0
set ROOT=%SCRIPT_DIR%

cd /d "%ROOT%" || exit /b 1

if not exist "%ROOT%\logs" mkdir "%ROOT%\logs"
set NODE_ENV=production

REM If runtime dependencies are not installed, install them (prefer pnpm)
if not exist "%ROOT%\node_modules" (
  echo [runtime] Installing minimal production dependencies...
  where pnpm >nul 2>nul && (
    pnpm install --prod --frozen-lockfile || pnpm install --prod
  ) || (
    where npm >nul 2>nul && (
      npm install --only=prod
    ) || (
      echo Neither pnpm nor npm found. Please install one of them and rerun.
      exit /b 1
    )
  )
)

REM Run and append logs
node "%ROOT%\scripts\run.mjs" >> "%ROOT%\logs\app.log" 2>&1
