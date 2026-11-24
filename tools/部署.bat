@echo off
chcp 65001 >nul
title 深时 · 部署
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0deploy.ps1"
echo.
pause
