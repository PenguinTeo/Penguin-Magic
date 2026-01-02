@echo off
chcp 65001 > nul
title 企鹅工坊 - 构建安装程序

REM 检查管理员权限
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo 需要管理员权限，正在请求...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

echo 正在构建安装程序...
echo.

cd /d "%~dp0"
set CSC_IDENTITY_AUTO_DISCOVERY=false
set WIN_CSC_LINK=
set CSC_LINK=

npx electron-builder --win nsis

echo.
echo 构建完成！
pause
