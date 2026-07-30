<#
  Atlas build (engine tool; atlas name/paths come from atlas.config.json).

  G:\ (Google Drive) can't host node_modules or a Vite build, so we mirror the
  app to C:\_builds\<project>, install + build there, then copy the finished
  site back.

  Usage (via the atlas's tools\build.ps1 shim):
    tools\build.ps1              # verify + validate + data + full build -> site\
    tools\build.ps1 -SkipData    # skip validate + data regen (app-only change)
    tools\build.ps1 -Dev         # copy sources to C:\ and start the dev server
#>
[CmdletBinding()]
param(
  [switch]$SkipData,
  [switch]$Dev
)
$ErrorActionPreference = "Stop"

$engineTools = $PSScriptRoot                              # ...\tools\engine
$proj = Split-Path -Parent (Split-Path -Parent $engineTools)  # atlas root
$cfg = Get-Content (Join-Path $proj "atlas.config.json") -Raw | ConvertFrom-Json
$appSrc = Join-Path $proj "app"
$work = "C:\_builds\$($cfg.project)"
$appWork = Join-Path $work "app"
$siteOut = Join-Path $proj "site"

Write-Host "== $($cfg.name) build ==" -ForegroundColor Cyan

Write-Host "-> Verifying vendored engine ..." -ForegroundColor Yellow
python (Join-Path $engineTools "verify_manifest.py")
if ($LASTEXITCODE -ne 0) { throw "verify_manifest.py failed" }

if (-not $SkipData) {
  Write-Host "-> Validating catalog ..." -ForegroundColor Yellow
  python (Join-Path $engineTools "validate_catalog.py")
  if ($LASTEXITCODE -ne 0) { throw "validate_catalog.py failed" }
  Write-Host "-> Regenerating data/ from resources + content/ ..." -ForegroundColor Yellow
  python (Join-Path $engineTools "build_data.py")
  if ($LASTEXITCODE -ne 0) { throw "build_data.py failed" }
}

# Mirror sources to C:\ (exclude the heavy/generated dirs).
Write-Host "-> Syncing sources to $appWork ..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path $appWork | Out-Null
robocopy $appSrc $appWork /MIR /XD node_modules dist .vite /NFL /NDL /NJH /NJS /NP | Out-Null
if ($LASTEXITCODE -ge 8) { throw "robocopy failed with code $LASTEXITCODE" }

Push-Location $appWork
try {
  if (-not (Test-Path (Join-Path $appWork "node_modules"))) {
    if (Test-Path (Join-Path $appWork "package-lock.json")) {
      Write-Host "-> npm ci ..." -ForegroundColor Yellow
      npm ci
      if ($LASTEXITCODE -ne 0) { throw "npm ci failed" }
    } else {
      Write-Host "-> npm install (no lockfile) ..." -ForegroundColor Yellow
      npm install
      if ($LASTEXITCODE -ne 0) { throw "npm install failed" }
    }
  }

  if ($Dev) {
    Write-Host "-> Starting dev server (Ctrl+C to stop) ..." -ForegroundColor Green
    Write-Host "   Edit sources under $appWork for live reload," -ForegroundColor DarkGray
    Write-Host "   or re-run without -Dev to produce site\." -ForegroundColor DarkGray
    npm run dev
    return
  }

  Write-Host "-> Building ..." -ForegroundColor Yellow
  npm run build
  if ($LASTEXITCODE -ne 0) { throw "vite build failed" }
}
finally {
  Pop-Location
}

# Copy the finished single-file site back to the repo's site\.
Write-Host "-> Copying dist\ back to $siteOut ..." -ForegroundColor Yellow
if (Test-Path $siteOut) { Remove-Item -Recurse -Force $siteOut }
New-Item -ItemType Directory -Force -Path $siteOut | Out-Null
robocopy (Join-Path $appWork "dist") $siteOut /MIR /NFL /NDL /NJH /NJS /NP | Out-Null
if ($LASTEXITCODE -ge 8) { throw "robocopy (dist copy-back) failed" }

$indexFile = Join-Path $siteOut "index.html"
$sizeKB = [math]::Round((Get-Item $indexFile).Length / 1KB)
Write-Host "== Done. Open $indexFile  (index.html = $sizeKB KB) ==" -ForegroundColor Green
exit 0   # robocopy leaves a non-zero $LASTEXITCODE even on success
