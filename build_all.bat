@echo off
chcp 65001 > nul
title 企鹅工坊 - 打包构建
cd /d "%~dp0"
color 0B

echo.
echo  ============================================
echo   企鹅工坊 - 安装包构建脚本
echo  ============================================
echo.

REM 检查 Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo  [错误] 未找到 Node.js，请先安装 Node.js 18+
    pause
    exit /b 1
)
echo  [✓] Node.js 就绪
echo.

REM 步骤1: 安装前端依赖
echo  [1/5] 安装前端依赖...
call npm install
if %errorlevel% neq 0 (
    color 0C
    echo  [错误] 前端依赖安装失败
    pause
    exit /b 1
)
echo  [✓] 前端依赖安装完成
echo.

REM 步骤2: 安装后端依赖
echo  [2/5] 安装后端依赖...
cd backend-nodejs
call npm install
if %errorlevel% neq 0 (
    color 0C
    echo  [错误] 后端依赖安装失败
    pause
    exit /b 1
)
cd ..
echo  [✓] 后端依赖安装完成
echo.

REM 步骤3: 构建前端
echo  [3/5] 构建前端...
call npm run build
if %errorlevel% neq 0 (
    color 0C
    echo  [错误] 前端构建失败
    pause
    exit /b 1
)
echo  [✓] 前端构建完成
echo.

REM 步骤4: 解压 Node.js 便携版
echo  [4/5] 准备 Node.js 运行时...
if not exist "installer\node-portable.zip" (
    color 0C
    echo  [错误] 未找到 Node.js 便携版
    echo         请先下载 node-v18.x.x-win-x64.zip 到 installer 目录
    pause
    exit /b 1
)

if not exist "build" mkdir "build"
if exist "build\nodejs" rmdir /s /q "build\nodejs"

powershell -Command "Expand-Archive -Path 'installer\node-portable.zip' -DestinationPath 'build\temp-node' -Force"
for /d %%i in (build\temp-node\*) do move "%%i" "build\nodejs" >nul
rmdir /s /q "build\temp-node"
echo  [✓] Node.js 运行时就绪
echo.

REM 步骤5: 复制文件到构建目录
echo  [5/5] 准备安装包文件...

REM 复制后端
if exist "build\backend" rmdir /s /q "build\backend"
mkdir "build\backend"
xcopy /E /I /Y "backend-nodejs\*" "build\backend\" >nul
echo       - 后端代码已复制

REM 复制前端构建产物
if exist "build\dist" rmdir /s /q "build\dist"
mkdir "build\dist"
xcopy /E /I /Y "dist\*" "build\dist\" >nul
echo       - 前端构建产物已复制

REM 复制启动器
if exist "build\launcher" rmdir /s /q "build\launcher"
mkdir "build\launcher"
xcopy /E /I /Y "launcher\*" "build\launcher\" >nul
echo       - 启动器已复制

REM 创建数据目录
if not exist "build\data" mkdir "build\data"
if not exist "build\input" mkdir "build\input"
if not exist "build\output" mkdir "build\output"
if not exist "build\creative_images" mkdir "build\creative_images"
echo       - 数据目录已创建

echo  [✓] 安装包文件准备完成
echo.

color 0A
echo  ============================================
echo   构建完成！
echo.
echo   请使用 Inno Setup 编译:
echo   installer\penguin-setup.iss
echo.
echo   或运行: iscc installer\penguin-setup.iss
echo  ============================================
echo.
pause
