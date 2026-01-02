@echo off
chcp 65001 >nul
echo 开始构建...
call npm run build:frontend
