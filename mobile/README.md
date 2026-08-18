# Community Connect Hub — Mobile App (React Native)

Week 9 deliverable: Android companion app sharing Firebase backend with the web app.

## Prerequisites

- Node.js 18+
- Android Studio with SDK
- JDK 17
- Firebase project: `community-connecthub` (same as web)

## Setup

```bash
# From repo root
npx react-native@latest init CommunityConnectHubMobile --directory mobile

cd mobile
npm install @react-native-firebase/app @react-native-firebase/auth @react-native-firebase/firestore
npm install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs
npm install react-native-screens react-native-safe-area-context
```

Copy `google-services.json` from Firebase Console → Android app into `mobile/android/app/`.

Use the same Firestore collections as web: `users`, `projects`, `requests`, `announcements`, `notifications`, `ratings`.

## Screens (Week 9 scope)

| Screen | Route | Status |
|--------|-------|--------|
| Login | `LoginScreen` | Scaffold in init |
| Register | `RegisterScreen` | Scaffold in init |
| Dashboard | `DashboardScreen` | To implement |
| Projects | `ProjectsScreen` | To implement |
| Requests | `RequestsScreen` | To implement |
| Announcements | `AnnouncementsScreen` | To implement |
| Ratings | `RatingsScreen` | To implement |
| Profile | `ProfileScreen` | To implement |

## Run on Android

```bash
cd mobile
npx react-native run-android
```

## Theme

Match web Cyber-Slate: background `#020617`, primary `#22D3EE`, card `#0F172A`.

## Notes

- Web app is the primary deliverable; mobile extends the same Firebase Auth + Firestore APIs.
- Run `npx react-native init` locally to generate native `android/` and `ios/` folders (not committed here due to size).
