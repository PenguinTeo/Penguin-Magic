@echo off
chcp 65001 >nul
echo.
echo ============================================================
echo 企鹅工坊 - 后端连接诊断工具
echo ============================================================
echo.

REM 检查后端 EXE 是否存在
echo [检查 1/5] 后端 EXE 文件
if exist backend-nodejs\penguin-backend.exe (
    echo     ✓ penguin-backend.exe 存在
    for %%A in ("backend-nodejs\penguin-backend.exe") do echo     大小: %%~zA 字节
) else (
    echo     ✗ penguin-backend.exe 不存在
    echo     需要先运行: cd backend-nodejs ^&^& npm run build
)
echo.

REM 检查前端构建
echo [检查 2/5] 前端构建文件
if exist dist\index.html (
    echo     ✓ 前端已构建 (dist/index.html)
) else (
    echo     ✗ 前端未构建
    echo     需要先运行: npm run build:frontend
)
echo.

REM 检查端口占用
echo [检查 3/5] 端口占用检查
netstat -ano | findstr :8766 >nul
if %errorlevel% equ 0 (
    echo     ⚠ 端口 8766 已被占用
    echo     占用进程:
    netstat -ano | findstr :8766
) else (
    echo     ✓ 端口 8766 可用
)
echo.

REM 检查 electron-builder 配置
echo [检查 4/5] electron-builder 配置
findstr /C:"!backend-nodejs/penguin-backend.exe" electron-builder.yml >nul
if %errorlevel% equ 0 (
    echo     ✗ 配置错误: penguin-backend.exe 被排除
    echo     位置: electron-builder.yml
    echo     修复方法: 删除包含 !backend-nodejs/penguin-backend.exe 的行
) else (
    echo     ✓ electron-builder 配置正确
)
echo.

REM 检查打包文件
echo [检查 5/5] 已打包的安装程序
if exist release (
    echo     ✓ 发现打包文件:
    dir /b release\*.exe 2>nul
    echo.
    echo     注意: 如果这些是修复前打包的,需要重新构建!
) else (
    echo     ⚠ 未发现打包文件
)
echo.

echo ============================================================
echo 诊断建议
echo ============================================================
echo.

REM 根据诊断结果给出建议
if not exist backend-nodejs\penguin-backend.exe (
    echo 🔴 优先级 1: 构建后端 EXE
    echo    cd backend-nodejs
    echo    npm run build
    echo.
)

if not exist dist\index.html (
    echo 🔴 优先级 2: 构建前端
    echo    npm run build:frontend
    echo.
)

findstr /C:"!backend-nodejs/penguin-backend.exe" electron-builder.yml >nul
if %errorlevel% equ 0 (
    echo 🔴 优先级 3: 修复 electron-builder 配置
    echo    编辑 electron-builder.yml,删除排除 penguin-backend.exe 的行
    echo.
)

if exist release (
    echo 🟡 优先级 4: 重新打包应用
    echo    运行: 修复后端连接-完整构建.bat
    echo.
)

echo ============================================================
echo.
pause
