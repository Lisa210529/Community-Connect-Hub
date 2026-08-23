# Move Android NDK to C:\ndk (no spaces in path) — fixes Windows C++ linker errors
$ErrorActionPreference = "Stop"

$ndkVersion = "27.1.12297006"
$sourceNdk = Join-Path $env:LOCALAPPDATA "Android\Sdk\ndk\$ndkVersion"
$targetNdk = "C:\ndk\$ndkVersion"
$localProps = "C:\dev\CCHMobile\android\local.properties"

if (-not (Test-Path $sourceNdk)) {
  Write-Host "NDK $ndkVersion not found at:`n  $sourceNdk"
  Write-Host "Install it in Android Studio: Tools -> SDK Manager -> SDK Tools -> NDK (Side by side)"
  exit 1
}

if (-not (Test-Path $targetNdk)) {
  Write-Host "Copying NDK to $targetNdk (one-time, ~1 GB)..."
  New-Item -ItemType Directory -Path "C:\ndk" -Force | Out-Null
  robocopy $sourceNdk $targetNdk /E /NFL /NDL /NJH /NJS /nc /ns /np | Out-Null
  if ($LASTEXITCODE -ge 8) { throw "robocopy failed with exit code $LASTEXITCODE" }
} else {
  Write-Host "NDK already at $targetNdk"
}

$sdkDir = "C\:\\Users\\Lisa NUMBUNDA\\AppData\\Local\\Android\\Sdk"
$ndkDir = "C\:\\ndk\\$ndkVersion"
$props = @"
sdk.dir=$sdkDir
ndk.dir=$ndkDir
"@

if (Test-Path (Split-Path $localProps -Parent)) {
  Set-Content -Path $localProps -Value $props
  Write-Host "Updated $localProps"
}

Write-Host @"

Done. In Android Studio (project C:\dev\CCHMobile\android):
  1. File -> Sync Project with Gradle Files
  2. Build -> Clean Project
  3. Delete these folders if they exist:
       C:\dev\CCHMobile\android\app\.cxx
       C:\dev\CCHMobile\node_modules\react-native-screens\android\.cxx
  4. Run the app again (green play button)
"@
