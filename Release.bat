@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo.
echo ══════════════════════════════════════════════════
echo       🐧 PenguinMagic 一键发布工具
echo ══════════════════════════════════════════════════
echo.

:: 获取当前版本号
for /f "tokens=2 delims=:, " %%a in ('findstr /c:"\"version\"" package.json') do (
    set "current_version=%%~a"
)
echo 📌 当前版本: %current_version%
echo.

:: 询问是否更新版本号
set /p update_ver="是否更新版本号 (+0.0.1)? [Y/n]: "
if /i "%update_ver%"=="" set update_ver=Y
if /i "%update_ver%"=="Y" (
    echo.
    echo 📝 正在更新版本号...
    node -e "const fs=require('fs');const p=JSON.parse(fs.readFileSync('package.json'));const v=p.version.split('.').map(Number);if(v[2]>=9){v[1]++;v[2]=0;}else{v[2]++;}p.version=v.join('.');fs.writeFileSync('package.json',JSON.stringify(p,null,2));console.log('✅ 版本号已更新: '+p.version);"
    if errorlevel 1 (
        echo ❌ 版本号更新失败
        pause
        exit /b 1
    )
    echo.
)

:: 执行打包
echo ══════════════════════════════════════════════════
echo 📦 开始打包...
echo ══════════════════════════════════════════════════
echo.
call npm run package
if errorlevel 1 (
    echo.
    echo ❌ 打包失败！
    pause
    exit /b 1
)

echo.
echo ══════════════════════════════════════════════════
echo 📤 开始上传...
echo ══════════════════════════════════════════════════
echo.
call npm run upload
if errorlevel 1 (
    echo.
    echo ❌ 上传失败！
    pause
    exit /b 1
)

echo.
echo ══════════════════════════════════════════════════
echo 🎉 发布完成！
echo ══════════════════════════════════════════════════
echo.
pause
