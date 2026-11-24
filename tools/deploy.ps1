<#
  深时 · 一键部署学生门户
  用法：双击 tools\部署.bat，或
        powershell -ExecutionPolicy Bypass -File tools\deploy.ps1 -Dir "C:\path\to\site"

  依赖：tools\.wrangler（wrangler 3）、tools\.cf-token（Cloudflare API Token）
#>
param(
  [string]$Dir = "",
  [string]$Project = "deep-portal",
  [string]$AccountId = "bda4b1da20fe4ba474d76807e9d7dd6f"
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$wrangler = Join-Path $PSScriptRoot ".wrangler\node_modules\.bin\wrangler.cmd"
$tokenFile = Join-Path $PSScriptRoot ".cf-token"

if (-not (Test-Path $wrangler)) { throw "缺少 wrangler，请先运行 npm i --prefix tools/.wrangler wrangler@3" }
if (-not (Test-Path $tokenFile)) { throw "缺少 tools\.cf-token（内容为 Cloudflare API Token）" }

$token = (Get-Content $tokenFile -Raw).Trim()
if (-not $token) { throw "tools\.cf-token 是空的" }

if (-not $Dir) {
  $latest = Get-ChildItem "$env:USERPROFILE\Desktop" -Directory -Filter "deep-portal-site-*" |
    Sort-Object LastWriteTime -Descending | Select-Object -First 1
  if (-not $latest) { throw "桌面上没有 deep-portal-site-* 目录，先跑 tools\打包资料.bat" }
  $Dir = $latest.FullName
}

if (-not (Test-Path (Join-Path $Dir "index.html"))) { throw "目录里没有 index.html：$Dir" }

$size = [math]::Round(((Get-ChildItem $Dir -Recurse -File | Measure-Object Length -Sum).Sum / 1MB), 1)
Write-Host ""
Write-Host "  深时 · 部署学生门户" -ForegroundColor White
Write-Host "  ─────────────────────────────"
Write-Host "  目录：$Dir"
Write-Host "  体积：$size MB"
Write-Host ""

$env:CLOUDFLARE_API_TOKEN = $token
$env:CLOUDFLARE_ACCOUNT_ID = $AccountId

& $wrangler pages deploy $Dir --project-name $Project --commit-dirty=true

Write-Host ""
Write-Host "  线上地址：https://$Project.pages.dev" -ForegroundColor Green
Write-Host ""
