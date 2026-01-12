@echo off
chcp 437 > nul
cd /d "%~dp0"
title Penguin Magic World - Restart
color 0B

echo.
echo  ============================================
echo       Penguin Magic World - Restart
echo  ============================================
echo.

REM ========================================
REM Step 1: STOP
REM ========================================
echo  [1/3] Stopping existing services...
echo.

for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":8765 " ^| findstr "LISTENING"') do (
    taskkill /f /pid %%a >nul 2>&1
    echo        [OK] Stopped PID: %%a
)
taskkill /f /fi "WINDOWTITLE eq PenguinMagic-Backend" >nul 2>&1

echo        [OK] All services stopped
echo.

REM ========================================
REM Step 2: INSTALL
REM ========================================
echo  [2/3] Installing dependencies...
echo.

REM Check Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo  [ERROR] Node.js not found!
    echo          Please install Node.js 18 or higher
    echo          Download: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

for /f "tokens=1" %%i in ('node --version 2^>^&1') do set NODE_VER=%%i
echo        Node.js %NODE_VER% detected
echo.

REM Install Frontend
echo        Installing frontend...
call npm install >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo        [ERROR] Frontend install failed!
    pause
    exit /b 1
)
echo        [OK] Frontend dependencies installed

REM Install Backend
echo        Installing backend...
cd backend-nodejs
call npm install >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo        [ERROR] Backend install failed!
    pause
    exit /b 1
)
cd ..
echo        [OK] Backend dependencies installed

REM Build Frontend
echo        Building frontend...
call npm run build >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo        [ERROR] Build failed!
    pause
    exit /b 1
)
echo        [OK] Frontend built
echo.

REM Create Directories
if not exist "data" mkdir "data"
if not exist "input" mkdir "input"
if not exist "output" mkdir "output"
if not exist "creative_images" mkdir "creative_images"

echo        [OK] Installation complete
echo.

REM ========================================
REM Step 3: START
REM ========================================
echo  [3/3] Starting services...
echo.

REM Start backend
echo        Starting Node.js backend...
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
echo        [OK] Backend running (8765)
echo.

REM ========================================
REM SUCCESS
REM ========================================
color 0A
echo  ============================================
echo.
echo       Restart Complete!
echo.
echo   Opening browser...
echo.
echo  ============================================
echo.

start http://127.0.0.1:8765

timeout /t 3 > nul
