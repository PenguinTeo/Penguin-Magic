@echo off
chcp 437 > nul
title Penguin Magic World - Install
cd /d "%~dp0"
color 0B

echo.
echo  ============================================
echo       Penguin Magic World - Install
echo  ============================================
echo.

REM Check Environment
echo  [1/4] Checking environment...
echo.

where node >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo  [ERROR] Node.js not found!
    echo.
    echo  Please install Node.js 18 or higher:
    echo  Download: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

for /f "tokens=1" %%i in ('node --version 2^>^&1') do set NODE_VER=%%i
echo  [OK] Node.js %NODE_VER%
echo.

REM Install Frontend Dependencies
echo  [2/4] Installing frontend dependencies...
echo        This may take a few minutes...
echo.

call npm install
if %errorlevel% neq 0 (
    color 0C
    echo.
    echo  [ERROR] Frontend dependencies failed!
    echo          Please check network connection.
    pause
    exit /b 1
)

echo.
echo  [OK] Frontend dependencies installed
echo.

REM Install Backend Dependencies
echo  [3/4] Installing backend dependencies...
echo.

cd backend-nodejs
call npm install
if %errorlevel% neq 0 (
    color 0C
    echo.
    echo  [ERROR] Backend dependencies failed!
    echo          Please check network connection.
    pause
    exit /b 1
)
cd ..

echo.
echo  [OK] Backend dependencies installed
echo.

REM Build Frontend
echo  [4/4] Building frontend...
echo.

call npm run build
if %errorlevel% neq 0 (
    color 0C
    echo.
    echo  [ERROR] Frontend build failed!
    pause
    exit /b 1
)

echo.
echo  [OK] Frontend build complete
echo.

REM Create Directories
echo  Creating data directories...

if not exist "data" mkdir "data"
if not exist "input" mkdir "input"
if not exist "output" mkdir "output"
if not exist "creative_images" mkdir "creative_images"

echo  [OK] Directories created
echo.

REM Done
color 0A
echo.
echo  ============================================
echo.
echo       Installation Complete!
echo.
echo   You can now run the application:
echo   Double-click "Start.bat" to launch
echo.
echo  ============================================
echo.
pause