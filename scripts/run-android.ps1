# Community Connect Hub — build & run Android from C:\dev (avoids "&" in OneDrive path)
$ErrorActionPreference = "Stop"

$Source = Join-Path $PSScriptRoot "..\mobile\CommunityConnectHubMobile" | Resolve-Path
$Target = "C:\dev\CCHMobile"

Write-Host "Syncing mobile app to $Target ..."
if (-not (Test-Path C:\dev)) { New-Item -ItemType Directory -Path C:\dev | Out-Null }
robocopy $Source $Target /E /XD node_modules android\app\build android\build .gradle /NFL /NDL /NJH /NJS /nc /ns /np | Out-Null

Set-Location $Target

if (-not (Test-Path "node_modules\react-native\cli.js")) {
  Write-Host "Installing npm dependencies..."
  npm install
}

$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:PATH = "$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\emulator;$env:PATH"

if (-not (Test-Path "android\local.properties")) {
  @"
sdk.dir=C\:\\Users\\Lisa NUMBUNDA\\AppData\\Local\\Android\\Sdk
ndk.dir=C\:\\ndk\\27.1.12297006
"@ | Set-Content "android\local.properties"
}

# Ensure NDK lives at C:\ndk (Windows username spaces break native builds)
& (Join-Path $PSScriptRoot "setup-android-ndk.ps1")

Write-Host @"

IMPORTANT: Keep Metro running in another terminal:
  cd C:\dev\CCHMobile
  npm start

Then this script installs the app on your emulator/device...
"@

npm run android -- --port 8081
