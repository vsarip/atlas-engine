# Shim: the real build lives in the vendored engine (tools\engine\build.ps1).
& (Join-Path $PSScriptRoot "engine\build.ps1") @args
exit $LASTEXITCODE
