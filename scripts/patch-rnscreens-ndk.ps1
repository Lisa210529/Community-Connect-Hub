# Fix react-native-screens C++ linker errors with Android NDK 27
$cmake = Join-Path $PSScriptRoot "..\mobile\CommunityConnectHubMobile\node_modules\react-native-screens\android\CMakeLists.txt" | Resolve-Path -ErrorAction SilentlyContinue
if (-not $cmake) { Write-Host "Skip: react-native-screens not installed yet"; exit 0 }

$content = Get-Content $cmake -Raw
if ($content -match 'c\+\+_shared') { Write-Host "Already patched: $cmake"; exit 0 }

$content = $content -replace 'target_link_libraries\(rnscreens\r?\n', "target_link_libraries(rnscreens`n    c++_shared`n"
Set-Content -Path $cmake -Value $content -NoNewline
Write-Host "Patched: $cmake"
