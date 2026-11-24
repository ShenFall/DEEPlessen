@echo off
chcp 65001 >nul
title 深时 · 资料打包
node "%~dp0build-portal.mjs"
echo.
pause
