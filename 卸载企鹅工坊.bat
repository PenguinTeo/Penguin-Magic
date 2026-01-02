@echo off
chcp 65001 > nul
title 企鹅工坊 - 卸载程序
color 0E

echo.
echo  ════════════════════════════════════════════
echo   企鹅工坊 - 卸载程序
echo  ════════════════════════════════════════════
echo.
echo  确定要卸载企鹅工坊吗？
echo  注意：您的创作数据将被保留在原位置
echo.
choice /c YN /n /m "  继续卸载？(Y/N): "
if %errorlevel%==2 (
    echo.
    echo  卸载已取消。
    timeout /t 2 > nul
    exit /b 0
)

echo.
echo  [1/3] 停止服务...
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":8765 " ^| findstr "LISTENING"') do (
    taskkill /f /pid %%a >nul 2>&1
)
echo  [✓] 服务已停止
echo.

echo  [2/3] 删除程序文件...
set "INSTALL_DIR=%LOCALAPPDATA%\PenguinMagic"
if exist "%INSTALL_DIR%\nodejs" rmdir /s /q "%INSTALL_DIR%\nodejs"
if exist "%INSTALL_DIR%\backend" rmdir /s /q "%INSTALL_DIR%\backend"
if exist "%INSTALL_DIR%\dist" rmdir /s /q "%INSTALL_DIR%\dist"
if exist "%INSTALL_DIR%\launcher" rmdir /s /q "%INSTALL_DIR%\launcher"
echo  [✓] 程序文件已删除
echo.

echo  [3/3] 删除桌面快捷方式...
del "%USERPROFILE%\Desktop\企鹅工坊.lnk" 2>nul
echo  [✓] 快捷方式已删除
echo.

echo  ════════════════════════════════════════════
echo.
echo  卸载完成！
echo.
echo  注意：以下数据已保留（如需删除请手动删除）：
echo   - %INSTALL_DIR%\data
echo   - %INSTALL_DIR%\input
echo   - %INSTALL_DIR%\output
echo   - %INSTALL_DIR%\creative_images
echo.
echo  ════════════════════════════════════════════
echo.
pause
