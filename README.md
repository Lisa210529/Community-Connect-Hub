# Community Connect Hub

Community Connect Hub: A Digital Governance & Councilor Performance Tracking System for Madang Province — IS406 Final Year Project.

Web-based ward development and community engagement platform built with **React**, **Vite**, and **Firebase**.

## Tech Stack

- React 18 + Vite
- Firebase Authentication, Firestore, Storage, Hosting
- Bootstrap 5
- GitHub Actions (CI)

## Project Structure

```
Community-ConnectHub/
├── public/                 # Static assets (favicon, etc.)
├── src/
│   ├── assets/             # Images, icons, styles
│   ├── components/         # Reusable UI (common, layout, forms, ui)
│   ├── pages/              # Route-level page modules
│   ├── services/           # Firebase & API services
│   ├── hooks/              # Custom React hooks
│   ├── context/            # React context providers
│   ├── routes/             # Route definitions
│   ├── utils/              # Helper functions
│   ├── constants/          # App-wide constants
│   ├── config/             # Environment configuration
│   └── types/              # Shared type definitions
├── database/               # Firestore rules & schemas
├── scripts/                # Seed & maintenance scripts
├── docs/                   # Documentation
├── tests/                  # Test suites
├── legacy/                 # Original vanilla HTML/JS app (reference)
└── .github/workflows/      # CI/CD pipelines
```

## Getting Started

### Prerequisites

- Node.js 18+
- Firebase CLI (`npm install -g firebase-tools`)

### Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Firebase Emulators (local dev)

```bash
firebase emulators:start
npm run seed:emulator   # in another terminal
```

Then open `http://localhost:3000?emulators=1`.

### Build & Deploy

```bash
npm run build
firebase deploy --only hosting
```

## Environment Variables

Copy `.env.example` to `.env` and adjust values if needed:

```bash
cp .env.example .env
```

## Migration Notes

The original single-file app lives in `legacy/` for reference while features are migrated into React modules under `src/pages/` and `src/components/`.

## License

MIT — see [LICENSE](LICENSE).
