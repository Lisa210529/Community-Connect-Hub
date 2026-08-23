# Community Connect Hub — Android Mobile App

React Native app (`CommunityConnectHubMobile`) sharing Firebase Auth + Firestore with the web app.

## Prerequisites

- Node.js **22.11+**
- JDK 17+
- Android Studio with SDK 37, Android emulator or physical device
- Firebase project: `community-connecthub`

## 1. Install dependencies (Windows / PowerShell)

From the repo root:

```powershell
.\scripts\setup-mobile.ps1
```

Or manually:

```powershell
cd mobile\CommunityConnectHubMobile
npx --yes rimraf node_modules
Remove-Item package-lock.json -Force -ErrorAction SilentlyContinue
npm install
npx react-native --version
```

> **OneDrive:** If `Remove-Item node_modules` fails or `react-native/cli.js` is missing, use `rimraf` as above or move the project to `C:\dev\` (OneDrive sync breaks deep `node_modules` paths).
>
> **Do not** install `react-native-cli` globally — it conflicts with the local CLI. Run `npm uninstall -g react-native-cli` if you did.

## 2. Connect Firebase (Android)

1. Open [Firebase Console](https://console.firebase.google.com/) → **community-connecthub**
2. Project Settings → **Add app** → Android
3. Package name: `com.communityconnecthubmobile`
4. Download `google-services.json`
5. Copy to: `android/app/google-services.json`

See `android/app/google-services.json.example` for the expected structure.

## 3. Run on Android

Start Metro (stop any existing Metro on port 8081 first with Ctrl+C):

```powershell
npm start
```

In another terminal:

```powershell
npm run android
```

> **Path with `&`:** If `npx react-native start` fails, use `npm start` instead — scripts call the CLI via `node` to avoid Windows path truncation.

## App structure

```
src/
├── screens/       Login, Register, Dashboard, Projects, Requests, Announcements, Profile
├── navigation/    Auth stack + main tab navigator
├── services/      firebaseService, notificationService
├── context/       AuthContext
├── components/    Shared UI (Cyber-Slate theme)
└── constants/     colors.js
```

## Features

- Email/password login and resident registration
- Ward-scoped projects and announcements from Firestore
- Resident request list
- FCM token saved to user profile (after `google-services.json` is added)

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `Cannot find module react-native/cli.js` | Run `.\scripts\setup-mobile.ps1` from repo root; uninstall global `react-native-cli` |
| `Remove-Item node_modules` fails (Windows) | Use `npx rimraf node_modules` instead of `Remove-Item -Recurse` |
| `google-services.json` missing | Download from Firebase Console and place in `android/app/` |
| Gradle sync fails | Open `android/` folder in Android Studio and sync |
| C++ linker errors (`undefined symbol: std::...`) on Windows | Run `.\scripts\setup-android-ndk.ps1` from repo root, then Sync + Clean in Android Studio. Your Windows username has a space — NDK must be at `C:\ndk\27.1.12297006`. |
| Build from OneDrive path (`&` in folder name) | Copy mobile app to `C:\dev\CCHMobile` and open that folder in Android Studio |
| Metro cache | `npx react-native start --reset-cache` |
| Emulator not found | Start an AVD in Android Studio Device Manager |

## Web push (related)

Browser push notifications are configured in the root web app (`public/firebase-messaging-sw.js`, `VITE_VAPID_PUBLIC_KEY` in `.env`).
