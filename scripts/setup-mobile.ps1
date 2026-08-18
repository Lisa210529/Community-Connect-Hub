# Community Connect Hub — React Native mobile setup (Windows / PowerShell)
# Fixes "Cannot find module react-native/cli.js" caused by broken node_modules (common on OneDrive).

$ErrorActionPreference = "Stop"
$MobileDir = Join-Path $PSScriptRoot "..\mobile\CommunityConnectHubMobile" | Resolve-Path

Write-Host "Mobile app directory: $MobileDir"
Set-Location $MobileDir

Write-Host "`n[1/4] Removing global react-native-cli (conflicts with local CLI)..."
npm uninstall -g react-native-cli 2>$null

Write-Host "`n[2/4] Cleaning node_modules (rimraf handles long OneDrive paths)..."
npx --yes rimraf node_modules
if (Test-Path package-lock.json) { Remove-Item package-lock.json -Force }

Write-Host "`n[3/4] Installing dependencies..."
npm install

Write-Host "`n[4/4] Verifying React Native CLI..."
npx react-native --version
if (-not (Test-Path "node_modules\react-native\cli.js")) {
  Write-Error "react-native/cli.js still missing. Move the project out of OneDrive (e.g. C:\dev\) and run this script again."
}

Write-Host @"

Done. Next steps:
  Terminal 1:  npm start
  Terminal 2:  npm run android   (emulator must be running in Android Studio)

If npm install fails on OneDrive, copy the repo to C:\dev\CommunityConnectHub and rerun this script.
"@
