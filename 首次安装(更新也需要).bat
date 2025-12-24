@echo off
chcp 65001 > nul
title 企鹅艾洛魔法世界 - 首次安装
cd /d "%~dp0"
color 0B

echo.
echo  ============================================
echo       企鹅艾洛魔法世界 - 首次安装
echo  ============================================
echo.

REM Check Environment
echo  [1/4] 检查环境...
echo.

where node >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo  [ERROR] 未找到 Node.js！
    echo.
    echo  请安装 Node.js 18 或更高版本:
    echo  下载: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

for /f "tokens=1" %%i in ('node --version 2^>^&1') do set NODE_VER=%%i
echo  [OK] Node.js %NODE_VER%
echo.

REM Install Frontend Dependencies
echo  [2/4] 安装前端依赖...
echo        这可能需要几分钟...
echo.

call npm install
if %errorlevel% neq 0 (
    color 0C
    echo.
    echo  [ERROR] 前端依赖安装失败！
    echo          请检查网络连接
    pause
    exit /b 1
)

echo.
echo  [OK] 前端依赖安装完成
echo.

REM Install Backend Dependencies
echo  [3/4] 安装后端依赖...
echo.

cd backend-nodejs
call npm install
if %errorlevel% neq 0 (
    color 0C
    echo.
    echo  [ERROR] 后端依赖安装失败！
    echo          请检查网络连接
    pause
    exit /b 1
)
cd ..

echo.
echo  [OK] 后端依赖安装完成
echo.

REM Build Frontend
echo  [4/4] 构建前端项目...
echo.

call npm run build
if %errorlevel% neq 0 (
    color 0C
    echo.
    echo  [ERROR] 前端构建失败！
    pause
    exit /b 1
)

echo.
echo  [OK] 前端构建完成
echo.

REM Create Directories
echo  创建数据目录...

if not exist "data" mkdir "data"
if not exist "input" mkdir "input"
if not exist "output" mkdir "output"
if not exist "creative_images" mkdir "creative_images"

echo  [OK] 目录创建完成
echo.

REM Done
color 0A
echo.
echo  ============================================
echo.
echo       安装完成！
echo.
echo   现在可以运行应用程序:
echo   双击 "一键启动.bat" 来启动
echo.
echo  ============================================
echo.
pause