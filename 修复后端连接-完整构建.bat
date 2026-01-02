@echo off
chcp 65001 >nul
echo.
echo ============================================================
echo 企鹅工坊 - 修复后端连接问题
echo ============================================================
echo.
echo 此脚本将:
echo 1. 清理旧的构建文件
echo 2. 重新构建后端 EXE
echo 3. 构建前端
echo 4. 打包完整的 Electron 应用
echo.
echo 按 Ctrl+C 取消,或按任意键继续...
pause >nul
echo.

REM 1. 清理旧文件
echo [1/6] 清理旧构建文件...
if exist dist rmdir /s /q dist
if exist dist-electron rmdir /s /q dist-electron
if exist release rmdir /s /q release
if exist backend-nodejs\penguin-backend.exe del /f /q backend-nodejs\penguin-backend.exe
echo     ✓ 清理完成
echo.

REM 2. 检查依赖
echo [2/6] 检查依赖...
if not exist node_modules (
    echo     安装前端依赖...
    call npm install
)
if not exist backend-nodejs\node_modules (
    echo     安装后端依赖...
    cd backend-nodejs
    call npm install
    cd ..
)
echo     ✓ 依赖检查完成
echo.

REM 3. 构建前端
echo [3/6] 构建前端...
call npm run build:frontend
if %errorlevel% neq 0 (
    echo     ✗ 前端构建失败
    pause
    exit /b 1
)
echo     ✓ 前端构建完成
echo.

REM 4. 构建后端 EXE
echo [4/6] 构建后端 EXE (这可能需要几分钟)...
cd backend-nodejs
call npm run build
if %errorlevel% neq 0 (
    echo     ✗ 后端构建失败
    cd ..
    pause
    exit /b 1
)
cd ..

REM 检查 EXE 是否生成
if not exist backend-nodejs\penguin-backend.exe (
    echo     ✗ 后端 EXE 未生成!
    echo     请检查 backend-nodejs 目录
    pause
    exit /b 1
)
echo     ✓ 后端 EXE 构建完成
echo.

REM 5. 编译 Electron 主进程
echo [5/6] 编译 Electron 主进程...
call npm run build:electron 2>nul
if %errorlevel% neq 0 (
    echo     注意: Electron 主进程编译可能失败,将尝试继续
)
echo     ✓ Electron 准备完成
echo.

REM 6. 打包应用
echo [6/6] 打包 Electron 应用 (这可能需要几分钟)...
call npm run build:electron
if %errorlevel% neq 0 (
    echo     ✗ 打包失败
    pause
    exit /b 1
)
echo     ✓ 打包完成
echo.

echo ============================================================
echo 🎉 构建成功!
echo ============================================================
echo.
echo 安装程序位置: release\企鹅工坊-Setup.exe
echo.
echo 测试步骤:
echo 1. 运行 release\企鹅工坊-Setup.exe
echo 2. 安装后启动应用
echo 3. 检查是否能正常连接后端 (端口 8766)
echo.
echo 如仍有问题:
echo - 打开开发者工具查看错误 (F12)
echo - 检查进程管理器中是否有 penguin-backend.exe
echo - 查看 Windows 事件查看器中的应用程序日志
echo.
pause
