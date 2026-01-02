@echo off
chcp 65001 > nul
title 企鹅工坊 - 一键打包
cd /d "%~dp0"
color 0B

echo.
echo  ============================================
echo       企鹅工坊 - Electron 打包工具
echo  ============================================
echo.

REM 检查 Node.js
echo  [1/5] 检查环境...
where node >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo.
    echo  [错误] 未找到 Node.js！
    echo  请访问 https://nodejs.org/ 安装 Node.js 18 或更高版本
    echo.
    pause
    exit /b 1
)

for /f "tokens=1" %%i in ('node --version 2^>^&1') do set NODE_VER=%%i
echo  [OK] Node.js %NODE_VER%
echo.

REM 安装依赖
echo  [2/5] 安装依赖...
echo        这可能需要几分钟...
echo.

call npm install
if %errorlevel% neq 0 (
    color 0C
    echo.
    echo  [错误] 前端依赖安装失败！
    echo.
    pause
    exit /b 1
)

cd backend-nodejs
call npm install
if %errorlevel% neq 0 (
    color 0C
    echo.
    echo  [错误] 后端依赖安装失败！
    echo.
    pause
    exit /b 1
)
cd ..

echo.
echo  [OK] 依赖安装完成
echo.

REM 构建
echo  [3/5] 构建前端...
call npm run build:frontend
if %errorlevel% neq 0 (
    color 0C
    echo.
    echo  [错误] 前端构建失败！
    echo.
    pause
    exit /b 1
)

echo.
echo  [4/5] 构建后端...
call npm run build:backend
if %errorlevel% neq 0 (
    color 0C
    echo.
    echo  [错误] 后端构建失败！
    echo.
    pause
    exit /b 1
)

echo.
echo  [5/5] 打包应用...
call npm run build:electron
if %errorlevel% neq 0 (
    color 0C
    echo.
    echo  [错误] 应用打包失败！
    echo.
    pause
    exit /b 1
)

echo.
color 0A
echo  ============================================
echo.
echo       ✅ 打包完成！
echo.
echo   安装程序位置：
echo   release\企鹅工坊-Setup.exe
echo.
echo  ============================================
echo.
pause
