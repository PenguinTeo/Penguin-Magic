@echo off
chcp 65001 >nul
cls
echo.
echo ============================================================
echo 企鹅工坊 v0.3.0 - 开始完整构建
echo ============================================================
echo.
echo 构建步骤:
echo [1/4] 构建前端...
echo [2/4] 构建后端 EXE...
echo [3/4] 打包 Electron 应用...
echo [4/4] 生成安装程序...
echo.
echo 请稍候，这可能需要几分钟...
echo.
echo ============================================================
echo.

REM 切换到项目目录
cd /d "%~dp0"

REM 步骤 1: 构建前端
echo [步骤 1/4] 正在构建前端...
call npm run build:frontend
if %errorlevel% neq 0 (
    echo.
    echo ❌ 前端构建失败！
    echo 请检查上面的错误信息
    pause
    exit /b 1
)
echo ✅ 前端构建完成
echo.

REM 步骤 2: 构建后端
echo [步骤 2/4] 正在构建后端 EXE...
cd backend-nodejs
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo ❌ 后端构建失败！
    echo 请检查上面的错误信息
    cd ..
    pause
    exit /b 1
)
cd ..
if not exist backend-nodejs\penguin-backend.exe (
    echo ❌ 后端 EXE 未生成！
    pause
    exit /b 1
)
echo ✅ 后端构建完成
echo.

REM 步骤 3: 编译 Electron 主进程
echo [步骤 3/4] 准备 Electron 打包...
REM 这里会自动编译 TypeScript
echo ✅ 准备完成
echo.

REM 步骤 4: 打包应用
echo [步骤 4/4] 正在打包 Electron 应用（这可能需要几分钟）...
call npm run build:electron
if %errorlevel% neq 0 (
    echo.
    echo ❌ 打包失败！
    echo 请检查上面的错误信息
    pause
    exit /b 1
)
echo ✅ 打包完成
echo.

echo ============================================================
echo 🎉 构建成功完成！
echo ============================================================
echo.
echo 安装程序位置:
echo 📦 %~dp0release\企鹅工坊 Setup 0.3.0.exe
echo.
echo 下一步:
echo 1. 运行上面的安装程序
echo 2. 安装后启动应用
echo 3. 检查后端连接状态（应该看到绿房子）
echo.
echo ============================================================
echo.
pause
