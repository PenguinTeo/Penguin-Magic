@echo off
chcp 65001 > nul
cd /d "%~dp0"
title 🐧 企鹅工坊
color 0B

echo.
echo  ╔════════════════════════════════════════════╗
echo  ║     🐧 企鹅工坊 - 正在启动...           ║
echo  ╚════════════════════════════════════════════╝
echo.

:: 检查环境
echo  [检查] 验证运行环境...

where python >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo.
    echo  ❌ 未找到 Python！
    echo     请先运行 "首次安装.bat" 或安装 Python
    echo.
    pause
    exit /b 1
)
echo  ✓ Python 已就绪

where node >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo.
    echo  ❌ 未找到 Node.js！
    echo     请先运行 "首次安装.bat" 或安装 Node.js
    echo.
    pause
    exit /b 1
)
echo  ✓ Node.js 已就绪

:: 检查node_modules
if not exist "node_modules" (
    color 0E
    echo.
    echo  ⚠ 未安装依赖，正在执行 npm install...
    echo.
    call npm install
    if %errorlevel% neq 0 (
        color 0C
        echo  ❌ 依赖安装失败！
        pause
        exit /b 1
    )
)
echo  ✓ 依赖已就绪
echo.

:: 关闭已存在的服务
echo  [清理] 关闭旧服务...
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":8765 " ^| findstr "LISTENING"') do (
    taskkill /f /pid %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":5176 " ^| findstr "LISTENING"') do (
    taskkill /f /pid %%a >nul 2>&1
)
echo  ✓ 端口已清理
echo.

:: 创建必要目录
if not exist "data" mkdir "data"
if not exist "input" mkdir "input"
if not exist "output" mkdir "output"
if not exist "creative_images" mkdir "creative_images"

:: 启动后端
echo  [1/2] 启动后端服务 (Python)...
start "企鹅工坊-后端" cmd /c "cd /d "%~dp0backend" && python server.py || (echo 后端启动失败 && pause)"

:: 等待后端启动
echo        等待后端就绪...
ping 127.0.0.1 -n 4 > nul

:: 检查后端是否启动成功
netstat -ano | findstr ":8765" | findstr "LISTENING" >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo.
    echo  ❌ 后端启动失败！
    echo     请检查 Python 是否正确安装
    echo     或查看后端窗口的错误信息
    echo.
    pause
    exit /b 1
)
echo  ✓ 后端已启动 (8765)
echo.

:: 启动前端
echo  [2/2] 启动前端服务 (Vite)...
start "企鹅工坊-前端" /min cmd /c "cd /d "%~dp0" && npm run dev"

:: 等待前端启动
echo        等待前端就绪...
ping 127.0.0.1 -n 8 > nul

:: 检查前端
netstat -ano | findstr ":5176" | findstr "LISTENING" >nul 2>&1
if %errorlevel% neq 0 (
    color 0E
    echo  ⚠ 前端可能还在启动中，请稍等...
) else (
    echo  ✓ 前端已启动 (5176)
)

:: 打开浏览器
echo.
color 0A
echo  ✨ 启动成功！正在打开浏览器...
start http://localhost:5176

echo.
echo  ════════════════════════════════════════════
echo.
echo   服务已在后台运行，可以关闭此窗口。
echo.
echo   前端: http://localhost:5176
echo   后端: http://localhost:8765
echo.
echo   如需停止服务，请双击 "停止服务.bat"
echo.
echo  ════════════════════════════════════════════
echo.

timeout /t 5 > nul
