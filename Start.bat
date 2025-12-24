@echo off
chcp 437 > nul
cd /d "%~dp0"
title Penguin Magic World
color 0B

echo.
echo  ============================================
echo       Penguin Magic World - Starting...
echo  ============================================
echo.

REM Check Environment
echo  [CHECK] Checking environment...

where node >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo.
    echo  [ERROR] Node.js not found!
    echo          Please run "Install.bat" or install Node.js
    echo.
    pause
    exit /b 1
)
echo  [OK] Node.js ready

REM Check node_modules
if not exist "backend-nodejs\node_modules" (
    color 0E
    echo.
    echo  [WARN] Backend dependencies not installed.
    echo         Please run "Install.bat" first.
    echo.
    pause
    exit /b 1
)

if not exist "dist" (
    color 0E
    echo.
    echo  [WARN] Frontend not built.
    echo         Please run "Install.bat" first.
    echo.
    pause
    exit /b 1
)
echo  [OK] Dependencies ready
echo.

REM Kill existing services
echo  [CLEAN] Cleaning old services...
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":8765 " ^| findstr "LISTENING"') do (
    taskkill /f /pid %%a >nul 2>&1
)
echo  [OK] Port cleared
echo.

REM Create directories
if not exist "data" mkdir "data"
if not exist "input" mkdir "input"
if not exist "output" mkdir "output"
if not exist "creative_images" mkdir "creative_images"

REM Start backend
echo  [START] Starting Node.js backend...
start "PenguinMagic-Backend" cmd /c "cd /d "%~dp0backend-nodejs" && node src/server.js || (echo Backend failed && pause)"

REM Wait for backend
echo        Waiting for backend...
ping 127.0.0.1 -n 4 > nul

REM Check backend
netstat -ano | findstr ":8765" | findstr "LISTENING" >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo.
    echo  [ERROR] Backend startup failed!
    echo          Check backend window for errors.
    echo.
    pause
    exit /b 1
)
echo  [OK] Backend running (8765)
echo.

REM Open browser
color 0A
echo  [SUCCESS] Opening browser...
start http://127.0.0.1:8765

echo.
echo  ============================================
echo.
echo   Service is running in background.
echo   You can close this window.
echo.
echo   URL: http://127.0.0.1:8765
echo.
echo   To stop: run "Stop.bat"
echo.
echo  ============================================
echo.

timeout /t 5 > nul