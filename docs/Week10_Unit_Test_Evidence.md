# Week 10 — Unit Test Evidence
**Project:** Community Connect Hub  
**Student:** Lisa Numbunda (210529)  
**Course:** IS406  
**Test run date:** Monday, 24 August 2026  
**Result:** ✅ **13 / 13 tests passed**

---

## How to reproduce

From the project root in PowerShell:

```powershell
cd "C:\Users\Lisa NUMBUNDA\OneDrive - Divine Word University\Desktop\Year 4 - Sem 2\IS406 Project & Presentation\Community ConnectHub"
npm test
```

Expected output: `Test Files  5 passed (5)` and `Tests  13 passed (13)`.

---

## Trello Week 10 mapping

| Trello task | Test file | Tests | Status |
|-------------|-----------|-------|--------|
| Unit test authentication module | `tests/auth.test.js` | 3 | ✅ Pass |
| Unit test MFA module | `tests/mfa.test.js` | 2 | ✅ Pass |
| Unit test request management | `tests/requests.test.js` | 4 | ✅ Pass |
| Unit test project logging | `tests/ratings.test.js` | 2 | ✅ Pass (project rating module) |
| Unit test performance scorecard | `tests/scorecard.test.js` | 2 | ✅ Pass |
| Unit test web dashboard | `tests/scorecard.test.js` | (included) | ✅ Pass (resident dashboard stats helper) |

---

## Test details

### 1. Authentication (`tests/auth.test.js`)
- Reads NID from `nid` or `pid` field
- Normalizes user role from role, userCategory, or position
- Maps Firebase auth error codes to user-friendly messages

### 2. MFA (`tests/mfa.test.js`)
- Generates valid base32 TOTP secret
- Builds correct `otpauth://` enrollment URL

### 3. Request management (`tests/requests.test.js`)
- Normalizes request status strings
- Detects project vs letter requests
- Filters project requests
- Groups requests by category when threshold is met

### 4. Project rating / logging (`tests/ratings.test.js`)
- Allows rating only for funded/completed project statuses
- Computes overall score from five rating categories

### 5. Performance scorecard & web dashboard (`tests/scorecard.test.js`)
- Computes councillor performance scorecard from ward data
- Computes resident dashboard quick stats (projects, requests, complaints, avg rating)

---

## Latest terminal output (saved run)

```
 RUN  v3.2.7

 ✓ tests/scorecard.test.js (2 tests)
 ✓ tests/requests.test.js (4 tests)
 ✓ tests/auth.test.js (3 tests)
 ✓ tests/mfa.test.js (2 tests)
 ✓ tests/ratings.test.js (2 tests)

 Test Files  5 passed (5)
      Tests  13 passed (13)
   Duration  ~10s
```

Full raw log: `docs/Week10_Unit_Test_Evidence.txt`

---

## For Friday presentation

**Include:**
1. Screenshot of terminal after `npm test` (all green ✓)
2. This document or the Trello mapping table
3. One slide: *"Week 10 unit testing — 13 automated tests covering auth, MFA, requests, ratings, scorecard, and dashboard logic"*

**Mark Done on Trello after you run `npm test` locally and screenshot the result.**
