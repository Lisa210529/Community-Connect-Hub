# Community Connect Hub — Android Mobile App

React Native app (`CommunityConnectHubMobile`) sharing Firebase Auth + Firestore with the web app.

## Prerequisites

- Node.js **22.11+**
- JDK 17+
- Android Studio with SDK 37, Android emulator or physical device
- Firebase project: `community-connecthub`

## 1. Install dependencies

```bash
cd mobile/CommunityConnectHubMobile
npm install
```

## 2. Connect Firebase (Android)

1. Open [Firebase Console](https://console.firebase.google.com/) → **community-connecthub**
2. Project Settings → **Add app** → Android
3. Package name: `com.communityconnecthubmobile`
4. Download `google-services.json`
5. Copy to: `android/app/google-services.json`

See `android/app/google-services.json.example` for the expected structure.

## 3. Run on Android

Start Metro:

```bash
npm start
```

In another terminal:

```bash
npm run android
```

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
| `google-services.json` missing | Download from Firebase Console and place in `android/app/` |
| Gradle sync fails | Open `android/` folder in Android Studio and sync |
| Metro cache | `npx react-native start --reset-cache` |
| Emulator not found | Start an AVD in Android Studio Device Manager |

## Web push (related)

Browser push notifications are configured in the root web app (`public/firebase-messaging-sw.js`, `VITE_VAPID_PUBLIC_KEY` in `.env`).
