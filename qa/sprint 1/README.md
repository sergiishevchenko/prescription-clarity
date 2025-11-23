# 🧪 Sprint 1 – Auth & Profile Smoke

**Contents**

- `/defects` — bug reports found during Sprint 1 testing
- `/test-suite` — Qase.io import/export files
- `/test-runs` — test run results exported from Qase
- `/postman` — API collection and environment files for backend testing

---

## 🧰 Tools Used

| Tool                | Purpose                                                         |
| ------------------- | --------------------------------------------------------------- |
| **Qase.io**         | Test management (test cases, runs, reports)                     |
| **Postman**         | API testing for backend endpoints (`/api/auth`, `/api/profile`) |
| **Chrome DevTools** | Cookie/session validation, response inspection                  |
| **GitHub**          | Storage and version control for QA documentation                |

---

## 🔗 Postman Collection

**Location:**  
`/qa/sprint1/postman/`

**Files included:**

- `mcs_mvp_api_collection.json` — main API collection for authentication and profile testing
- `mcs_mvp_environment.json` — environment variables (base URL, token, etc.)

**Endpoints covered:**

- `POST /api/auth/register` — Create user account (valid/duplicate email)
- `POST /api/auth/login` — Login and validate cookie session
- `POST /api/auth/logout` — Logout and verify cookie deletion
- `GET /api/profile` — Retrieve user profile data
- `PATCH /api/profile` — Update user profile fields

**Purpose:**  
Validate API response codes, session handling, and data persistence across auth and profile flows.

---

## ✅ QA Artifacts Summary

| Category   | Artifact                                                              | Format | Location                  |
| ---------- | --------------------------------------------------------------------- | ------ | ------------------------- |
| Test Suite | `Sprint1_Auth_Profile_Smoke.xlsx`                                     | XLSX   | `qa/sprint 1/test-suite/` |
| Test Run   | `Sprint1_Run_Results.csv`                                             | CSV    | `qa/sprint 1/test-runs/`  |
| Defects    | `BUG-001_Registration_400_vs_409.md`<br>`BUG-002_Login_NoRedirect.md` | MD     | `qa/sprint 1/defects/`    |
| API Tests  | `mcs_mvp_api_collection.json`                                         | JSON   | `qa/sprint 1/postman/`    |

---

**QA Owner:** _Vladyslav Mazur_  
**Date:** _Sprint 1 (Weeks 1–2)_  
**Status:** ✅ Completed — awaiting review and merge to `main` branch.
