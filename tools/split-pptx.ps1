<#
  深时 · PPT 分册脚本
  用法：
    powershell -ExecutionPolicy Bypass -File tools\split-pptx.ps1 -Path "I:\DataSystem\地科\Capt 4_xxx.pptx"
    powershell -ExecutionPolicy Bypass -File tools\split-pptx.ps1 -Path "I:\DataSystem\地科" -MaxMB 24

  做的事：
    1. 用本机 PowerPoint 打开（只读）
    2. 按目标体积逐册切分，每册不超过 MaxMB
    3. 命名为「原名 1-30页.pptx」，输出到桌面\深时分册\
    4. 原始文件不动
#>
param(
  [Parameter(Mandatory = $true)][string]$Path,
  [int]$MaxMB = 24,
  [string]$OutDir = "$env:USERPROFILE\Desktop\深时分册",
  # 加 -KeepSource 则原文件留在原处；默认移到 深时分册\_原文件\（不删除）
  [switch]$KeepSource
)

$ErrorActionPreference = 'Stop'
$targetBytes = $MaxMB * 1MB

function Split-One([string]$file) {
  $name = [System.IO.Path]::GetFileNameWithoutExtension($file)
  $sizeMB = [math]::Round((Get-Item $file).Length / 1MB, 1)
  Write-Host ""
  Write-Host "  $name  ($sizeMB MB)" -ForegroundColor Cyan

  $app = New-Object -ComObject PowerPoint.Application
  $app.DisplayAlerts = 1
  $src = $null
  try {
    $src = $app.Presentations.Open($file, $true, $false, $false)
    $total = $src.Slides.Count
    $avg = (Get-Item $file).Length / [math]::Max($total, 1)
    $step = [math]::Max(3, [math]::Floor($targetBytes * 0.8 / $avg))
    Write-Host "    共 $total 页，预估每册 $step 页"

    $safeName = $name -replace '[\\/:*?"<>|]', '_'
    $dir = Join-Path $OutDir $safeName
    New-Item -ItemType Directory -Force -Path $dir | Out-Null

    $start = 1
    $part = 1
    while ($start -le $total) {
      $count = [math]::Min($step, $total - $start + 1)

      while ($count -ge 1) {
        $end = $start + $count - 1
        $out = Join-Path $dir ("{0} {1}-{2}页.pptx" -f $safeName, $start, $end)

        $new = $app.Presentations.Add(0)
        try {
          $new.PageSetup.SlideWidth = $src.PageSetup.SlideWidth
          $new.PageSetup.SlideHeight = $src.PageSetup.SlideHeight
          # 按页段从源文件插入，不走剪贴板（剪贴板在循环里不可靠）
          $new.Slides.InsertFromFile($file, 0, $start, $end) | Out-Null
          # 删除新建时自带的那张空白页
          if ($new.Slides.Count -gt ($end - $start + 1)) {
            $new.Slides.Item($new.Slides.Count).Delete()
          }
          $new.SaveAs($out, 24)  # ppSaveAsOpenXMLPresentation
        }
        finally {
          $new.Close()
        }

        $outMB = (Get-Item $out).Length / 1MB
        if ($outMB -le $MaxMB -or $count -eq 1) {
          if ($count -eq 1 -and $outMB -gt $MaxMB) {
            Write-Host ("    第 {0} 页单页就有 {1:N1} MB，无法再拆" -f $start, $outMB) -ForegroundColor Yellow
          }
          else {
            Write-Host ("    第 {0} 册：{1}-{2} 页  {3:N1} MB" -f $part, $start, $end, $outMB) -ForegroundColor Green
          }
          $start = $end + 1
          $part++
          break
        }

        # 超了：删掉重来，页数减半
        Remove-Item $out -Force
        $count = [math]::Floor($count / 2)
        if ($count -lt 1) { $count = 1 }
      }
    }

    if (-not $KeepSource) {
      $keep = Join-Path $OutDir '_原文件'
      New-Item -ItemType Directory -Force -Path $keep | Out-Null
      Move-Item -LiteralPath $file -Destination $keep -Force
      Write-Host "    原文件已移到 深时分册\_原文件\" -ForegroundColor DarkGray
    }
  }
  finally {
    if ($src) { $src.Close() }
    $app.Quit()
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($app) | Out-Null
    [GC]::Collect()
  }
}

Write-Host ""
Write-Host "  深时 · PPT 分册" -ForegroundColor White
Write-Host "  ─────────────────────────────"
Write-Host "  上限：$MaxMB MB / 册"
Write-Host "  输出：$OutDir"

if (Test-Path $Path -PathType Container) {
  $files = Get-ChildItem -Path $Path -Filter *.pptx | Where-Object { $_.Length -gt $targetBytes }
  if (-not $files) { Write-Host "  该目录没有超过 $MaxMB MB 的 pptx" -ForegroundColor Yellow; exit 0 }
  foreach ($f in $files) { Split-One $f.FullName }
}
else {
  if (-not (Test-Path $Path)) { throw "文件不存在：$Path" }
  Split-One (Resolve-Path $Path).Path
}

Write-Host ""
Write-Host "  完成。把分册拖回资料目录，删掉原超大文件，再跑一次打包脚本。" -ForegroundColor White
Write-Host ""
