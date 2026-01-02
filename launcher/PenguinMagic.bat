@echo off
chcp 65001 > nul
title Penguin Magic
cd /d "%~dp0.."
color 0B

echo.
echo  ============================================
echo   Penguin Magic - Starting...
echo  ============================================
echo.

REM 使用内置 Node.js（在安装根目录下）
set "NODE_PATH=%~dp0..\nodejs"
set "PATH=%NODE_PATH%;%PATH%"

REM 检查内置 Node.js
if not exist "%NODE_PATH%\node.exe" (
    color 0C
    echo  [ERROR] Node.js not found!
    echo         Please reinstall Penguin Magic.
    pause
    exit /b 1
)

echo  [OK] Node.js ready
echo.

REM 清理旧进程
echo  [CLEAN] Stopping old services...
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":8766 " ^| findstr "LISTENING"') do (
    taskkill /f /pid %%a >nul 2>&1
)
echo  [OK] Port cleared
echo.

REM 创建数据目录
if not exist "data" mkdir "data"
if not exist "input" mkdir "input"
if not exist "output" mkdir "output"
if not exist "creative_images" mkdir "creative_images"
if not exist "thumbnails" mkdir "thumbnails"

REM 启动后端（backend 在安装根目录下）
echo  [START] Starting backend service...
start "" /B cmd /c "cd /d "%~dp0..\backend" && "%NODE_PATH%\node.exe" src/server.js"

REM 等待启动
echo         Please wait...
ping 127.0.0.1 -n 4 > nul

REM 检查服务
netstat -ano | findstr ":8766" | findstr "LISTENING" >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo.
    echo  [ERROR] Backend startup failed!
    pause
    exit /b 1
)

color 0A
echo  [OK] Service started!
echo.

REM 打开浏览器
echo  [OPEN] Opening browser...
start http://127.0.0.1:8766

echo.
echo  ============================================
echo   Penguin Magic is running!
echo.
echo   URL: http://127.0.0.1:8766
echo.
echo   Close this window to stop service
echo  ============================================
echo.

REM 保持运行
echo Press any key to stop...
pause > nul

REM 停止服务
echo.
echo  [STOP] Stopping service...
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":8766 " ^| findstr "LISTENING"') do (
    taskkill /f /pid %%a >nul 2>&1
)
echo  [OK] Service stopped
timeout /t 2 > nul
