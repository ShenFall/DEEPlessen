@echo off
chcp 65001 >nul
title 深时 · PPT 分册
if "%~1"=="" (
  echo  把要拆的 pptx 拖到本文件上，或用命令行传路径
  echo  示例: 拆分课件.bat "I://DataSystem//地科//xxx.pptx"
  pause
  exit /b
)
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0split-pptx.ps1" -Path "%~1"
echo.
pause
