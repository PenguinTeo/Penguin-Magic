@echo off
chcp 65001 >nul
title 企鹅工坊 - 一键构建

echo.
echo ========================================
echo    企鹅工坊 - 一键构建脚本
echo ========================================
echo.

:: 检查 Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未找到 Node.js，请先安装 Node.js
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)

:: 显示 Node.js 版本
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo [信息] Node.js 版本: %NODE_VERSION%

:: 运行构建脚本
echo.
echo [开始] 执行构建...
echo.

node scripts/build.js

if %errorlevel% neq 0 (
    echo.
    echo [错误] 构建失败!
    pause
    exit /b 1
)

echo.
echo [完成] 构建成功!
echo.
echo 安装包位于 release 目录
echo.
pause
