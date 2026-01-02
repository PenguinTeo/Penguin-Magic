@echo off
chcp 65001 >nul
title 测试企鹅工坊打包应用

echo.
echo ========================================
echo    测试企鹅工坊打包应用
echo ========================================
echo.

:: 检查打包输出是否存在
if not exist "release\win-unpacked\企鹅工坊.exe" (
    echo [错误] 未找到打包后的应用
    echo 请先运行 "一键构建.bat" 进行打包
    pause
    exit /b 1
)

echo [信息] 找到打包后的应用
echo [信息] 路径: release\win-unpacked\企鹅工坊.exe
echo.
echo [提示] 即将启动应用...
echo [提示] 请查看控制台输出以确认后端是否正常启动
echo.
pause

:: 启动应用
start "" "release\win-unpacked\企鹅工坊.exe"

echo.
echo [信息] 应用已启动
echo [提示] 如果应用无法正常运行，请检查：
echo   1. 端口 8766 是否被占用
echo   2. 防火墙是否阻止了应用
echo   3. 按 F12 打开开发者工具查看错误信息
echo.
pause
