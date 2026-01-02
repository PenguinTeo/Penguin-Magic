@echo off
chcp 65001 > nul
title 🐧 企鹅工坊 安装程序
cd /d "%~dp0"
color 0B

echo.
echo  ╔═══════════════════════════════════════════╗
echo  ║                                           ║
echo  ║   🐧  企鹅工坊 Penguin Magic  🐧          ║
echo  ║                                           ║
echo  ║        一键安装程序 v0.2.4                ║
echo  ║                                           ║
echo  ╚═══════════════════════════════════════════╝
echo.
echo  欢迎使用企鹅工坊！
echo  这是一款 AI 图像桌面管理工具，让您的创作井井有条。
echo.
echo  ─────────────────────────────────────────────
echo.

REM 检查是否以管理员运行
set "INSTALL_DIR=%LOCALAPPDATA%\PenguinMagic"

echo  安装目录: %INSTALL_DIR%
echo.
echo  按任意键开始安装，或按 Ctrl+C 取消...
pause > nul

echo.
echo  [1/4] 创建安装目录...
if exist "%INSTALL_DIR%" (
    echo        检测到旧版本，正在清理...
    rmdir /s /q "%INSTALL_DIR%\nodejs" 2>nul
    rmdir /s /q "%INSTALL_DIR%\backend" 2>nul
    rmdir /s /q "%INSTALL_DIR%\dist" 2>nul
    rmdir /s /q "%INSTALL_DIR%\launcher" 2>nul
)
mkdir "%INSTALL_DIR%" 2>nul
echo  [✓] 目录已创建
echo.

echo  [2/4] 复制程序文件...
echo        这可能需要一点时间，请耐心等待...

REM 复制 Node.js 运行时
xcopy /E /I /Y /Q "%~dp0build\nodejs" "%INSTALL_DIR%\nodejs" > nul
echo        - Node.js 运行时 ✓

REM 复制后端
xcopy /E /I /Y /Q "%~dp0build\backend" "%INSTALL_DIR%\backend" > nul
echo        - 后端服务 ✓

REM 复制前端
xcopy /E /I /Y /Q "%~dp0build\dist" "%INSTALL_DIR%\dist" > nul
echo        - 前端界面 ✓

REM 复制启动器
xcopy /E /I /Y /Q "%~dp0build\launcher" "%INSTALL_DIR%\launcher" > nul
echo        - 启动器 ✓

echo  [✓] 文件复制完成
echo.

echo  [3/4] 创建数据目录...
if not exist "%INSTALL_DIR%\data" mkdir "%INSTALL_DIR%\data"
if not exist "%INSTALL_DIR%\input" mkdir "%INSTALL_DIR%\input"
if not exist "%INSTALL_DIR%\output" mkdir "%INSTALL_DIR%\output"
if not exist "%INSTALL_DIR%\creative_images" mkdir "%INSTALL_DIR%\creative_images"
echo  [✓] 数据目录已创建
echo.

echo  [4/4] 创建桌面快捷方式...
set "SHORTCUT=%USERPROFILE%\Desktop\企鹅工坊.lnk"
set "VBS_FILE=%TEMP%\CreateShortcut.vbs"

echo Set oWS = WScript.CreateObject("WScript.Shell") > "%VBS_FILE%"
echo sLinkFile = "%SHORTCUT%" >> "%VBS_FILE%"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%VBS_FILE%"
echo oLink.TargetPath = "%INSTALL_DIR%\launcher\PenguinMagic.vbs" >> "%VBS_FILE%"
echo oLink.WorkingDirectory = "%INSTALL_DIR%" >> "%VBS_FILE%"
echo oLink.Description = "企鹅工坊 - AI 图像桌面管理工具" >> "%VBS_FILE%"
echo oLink.Save >> "%VBS_FILE%"

cscript //nologo "%VBS_FILE%"
del "%VBS_FILE%"
echo  [✓] 桌面快捷方式已创建
echo.

color 0A
echo  ╔═══════════════════════════════════════════╗
echo  ║                                           ║
echo  ║   🎉  安装完成！                          ║
echo  ║                                           ║
echo  ║   双击桌面上的「企鹅工坊」图标即可启动    ║
echo  ║                                           ║
echo  ╚═══════════════════════════════════════════╝
echo.
echo  是否立即启动企鹅工坊？(Y/N)
choice /c YN /n /m "  请选择: "
if %errorlevel%==1 (
    echo.
    echo  正在启动...
    start "" "%INSTALL_DIR%\launcher\PenguinMagic.vbs"
)
echo.
echo  感谢使用企鹅工坊！
echo.
timeout /t 3 > nul
