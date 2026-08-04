# Legacy Vanilla App

This folder contains the original **Community Connect Hub** implementation:

- `index.html` — single-page app with inline CSS (~2000 lines)
- `js/` — Firebase compat SDK modules (auth, CRUD, MFA, requests, etc.)

## Purpose

Kept as a **reference** while features are migrated into the React + Vite structure under `src/`.

## Running the legacy app

Serve `legacy/index.html` with any static server, or open the file directly (Firebase CDN scripts required).

## Migration mapping

| Legacy file | Target location |
|-------------|-----------------|
| `js/firebase-config.js` | `src/services/firebase.js`, `src/config/firebase.config.js` |
| `js/auth.js` | `src/services/authService.js`, `src/pages/Login/`, `src/pages/Register/` |
| `js/validation.js` | `src/utils/validation.js` |
| `js/ui.js` | `src/components/layout/`, `src/constants/` |
| `js/resident.js` | `src/pages/Resident/` |
| `js/crud.js` | `src/services/firestoreService.js` |
| Inline `<style>` | `src/assets/styles/` |

Do not add new features here — use `src/` instead.
