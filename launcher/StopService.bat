@echo off
chcp 65001 > nul
title Penguin Magic - Stop Service
cd /d "%~dp0.."
color 0E

echo.
echo  Stopping Penguin Magic service...
echo.

for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":8766 " ^| findstr "LISTENING"') do (
    taskkill /f /pid %%a >nul 2>&1
)

color 0A
echo  [OK] Service stopped
echo.
timeout /t 2 > nul
