# Milestone 1 Presentation
## Community Connect Hub — IS406 Digital Governance & WDC Management System

**Student:** Lisa Numbunda (210529)  
**Course:** IS406 — Project & Presentation  
**Pilot:** Ward 5 (Nabasa), Madang Urban LLG  
**Date:** August 2026

---

## Slide 1 — Title

**Community Connect Hub**  
Digital Governance & Ward Development Committee Management System

Lisa Numbunda | 210529 | Divine Word University

---

## Slide 2 — Problem Statement

- Ward residents lack transparent visibility into local government projects and funding.
- Service requests move through multiple actors (WDC → Councillor → Mayor → Provincial) with no unified tracking.
- **No WDC = No Government Funding** — wards without an active WDC cannot access DSIP/PSIP.
- Feedback and complaints are often informal with no audit trail.

---

## Slide 3 — Project Objectives

1. Provide role-based digital access for residents, councillors, WDC, mayor, and provincial admin.
2. Track the full service request & funding workflow with clear status transitions.
3. Enable residents to view ward projects, submit ratings, and lodge complaints.
4. Enforce WDC governance rules before provincial funding approval.
5. Secure access with NID verification, password policy, and MFA.

---

## Slide 4 — Scope (Milestone 1)

| Delivered in M1 | Status |
|-----------------|--------|
| Authentication (Login, Register, MFA) | ✅ Week 5 |
| System Design Document | ✅ Week 5 |
| Resident Dashboard (4.1) | ✅ Week 6 |
| Project Viewing — Resident (4.3) | ✅ Week 6 |
| Rating / Feedback Module (4.4) | ✅ Week 6 |
| Complaint Module (4.5) | ✅ Week 6 |
| Service Request Swimlane (4.2) | ✅ Prior sprint |
| Councillor / Mayor / Provincial dashboards | 🔄 Placeholder UI |

---

## Slide 5 — Technology Stack

| Layer | Choice |
|-------|--------|
| Frontend | HTML5, CSS3, Bootstrap 5, Vanilla JavaScript |
| Backend | Firebase (Auth + Firestore) |
| Local Dev | Firebase Emulators + `npx serve` |
| Identity | Firestore `nids` collection (NID verification) |
| Security | App-level MFA (SMS OTP + TOTP via OTPAuth) |
| Pilot Data | `seed-emulator.js` — Ward 5 Nabasa |

*Note: SevisPass and Docker replaced per IS406 study guide with NID + Firebase emulators.*

---

## Slide 6 — System Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Browser    │────▶│  Firebase Auth   │     │  Firestore DB   │
│  (Bootstrap │     │  (Email/Pass)    │────▶│  users, nids,   │
│   + JS)     │────▶│                  │     │  projects,      │
└─────────────┘     └──────────────────┘     │  ratings,       │
                              │                │  complaints,    │
                              ▼                │  requests, wards│
                     ┌──────────────────┐     └─────────────────┘
                     │  MFA Module      │
                     │  (SMS + TOTP)    │
                     └──────────────────┘
```

**Collections:** `users`, `nids`, `wards`, `projects`, `requests`, `ratings`, `complaints`, `announcements`, `wdc_members`

---

## Slide 7 — Authentication & Security (Week 5)

- **Login:** User ID + NID + Password (NID cross-checked against Firestore)
- **Registration:** NID validation, password rules (8+ chars, upper, lower, number, special)
- **MFA Enrollment:** SMS OTP (emulator toast) + Authenticator app (TOTP + QR)
- **MFA Verification:** Required on login when `mfaEnabled: true`

**Screenshot:** Login page, MFA enrollment (Security & MFA), MFA verify modal

---

## Slide 8 — Resident Dashboard (4.1)

**Features implemented:**
- Ward-scoped project statistics (total, completed, in progress, average rating)
- Quick counts: service requests and open complaints
- Ward welcome banner (Ward 5 — Nabasa)
- Recent projects table with status badges and star ratings
- "View All" link to full project list

**Screenshot:** Dashboard after login as resident `210529`

---

## Slide 9 — Project Viewing (4.3)

- Residents see only projects in their ward (`wardId`)
- Table: name, category, budget, status, average rating
- **View** button opens detail modal (location, funding source, description)
- **Rate This Project** button shown for completed/funded projects not yet rated

**Screenshot:** Projects page + project detail modal

---

## Slide 10 — Rating / Feedback Module (4.4)

Five rating categories (1–5 stars each):
1. Quality of Work
2. Timeliness
3. Community Benefit
4. Communication
5. Overall Satisfaction

- One rating per resident per project
- Optional anonymous submission
- History table shows past ratings

**Screenshot:** Rating form with star inputs + My Ratings table

---

## Slide 11 — Complaint Module (4.5)

- Submit complaint: subject, category, optional linked project, description
- Categories: Project Quality, Delay, Communication, Corruption, General
- Status tracking: `pending` → (future: reviewed/resolved by councillor)
- My Complaints history with submission date

**Screenshot:** Complaint form + complaints list

---

## Slide 12 — Service Request Process Model

Resident swimlane workflow:

```
Resident → WDC Review → Councillor → Mayor/Assembly → Provincial → Funded
                ↓
         rejected_no_wdc (if no WDC)
```

- Process tracker visual in request detail modal
- Role-specific actions at each stage
- Enforces WDC requirement before DSIP/PSIP approval

**Screenshot:** Service request list + detail modal with process tracker

---

## Slide 13 — Data Model (3NF)

| Collection | Key Fields |
|------------|------------|
| `users` | userId, role, wardId, nid, mfaEnabled |
| `nids` | name, ward, status |
| `wards` | wardNumber, wardName, wdcExists |
| `projects` | projectName, wardId, status, budget |
| `ratings` | projectId, residentId, category1–5Score, overallScore |
| `complaints` | residentId, wardId, projectId, subject, status |
| `requests` | residentId, wardId, status, processHistory |

No denormalized names — lookups via separate queries.

---

## Slide 14 — Demo Walkthrough

1. Start emulators: `firebase emulators:start`
2. Seed data: `node seed-emulator.js`
3. Serve app: `npx serve .` → http://localhost:3000
4. Login: **210529** / NID **123456789** / **TestPass1!**
5. Show dashboard stats (4 ward projects seeded)
6. View project → Rate Nabasa Community Hall
7. Submit a complaint
8. Submit a service request (Requests module)

---

## Slide 15 — Testing & Validation

| Test | Result |
|------|--------|
| Resident login with NID | Pass |
| Ward-scoped project filter | Pass |
| Rating submission (5 categories) | Pass |
| Duplicate rating prevention | Pass |
| Complaint create + list | Pass |
| MFA enrollment & login verify | Pass |
| Role-based sidebar visibility | Pass |

---

## Slide 16 — Challenges & Lessons Learned

- Firebase emulator data resets on restart → automated seed script essential
- NID verification replaces external SevisPass API — simpler for pilot
- App-level MFA (not Firebase native) gives SMS + TOTP flexibility in emulator
- 3NF lookups require async name resolution in UI tables

---

## Slide 17 — Milestone 2 Preview

- Councillor: project logging, announcement posting, complaint review
- WDC: full review queue integration
- Mayor: approval workflow, ward performance reports
- Provincial: DSIP/PSIP pipeline, analytics dashboard
- Firestore security rules hardening for production

---

## Slide 18 — Conclusion

Milestone 1 delivers a working **resident-facing module** with secure authentication, ward-scoped project visibility, community feedback (ratings), and complaint lodging — forming the foundation of transparent digital governance for Ward 5 Nabasa.

**Thank you — Questions?**

---

## Appendix — Screenshot Checklist for Submission

- [ ] Login page (User ID + NID + Password)
- [ ] Resident dashboard with ward stats
- [ ] Projects list (4 projects)
- [ ] Project detail modal
- [ ] Rating form (5 star categories)
- [ ] Complaint form + submitted complaint
- [ ] Service request with process tracker
- [ ] MFA Security page
- [ ] Firebase Emulator UI (Firestore collections)
- [ ] System Design Document cover page

## Appendix — Test Accounts

| Role | User ID | NID | Email | Password |
|------|---------|-----|-------|----------|
| Resident | 210529 | 123456789 | lisa@test.com | TestPass1! |
| Councillor | 300001 | 987654321 | councillor@test.com | TestPass1! |
| Mayor | 400001 | 111222333 | mayor@test.com | TestPass1! |
| Provincial | 500001 | 444555666 | provincial@test.com | TestPass1! |
