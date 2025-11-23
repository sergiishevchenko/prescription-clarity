# 🧪 Sprint 2 – Medications & Schedule QA

**Contents**

- `/defects` — Sprint 2 bug reports (Medications CRUD, Schedule generation)
- `/test-suite` — Qase.io export/import for manual suites
- `/test-runs` — run logs exported from Qase
- `/postman` — updated API collections for medications, schedule & calendar

---

## 🧰 Tools Used

| Tool                | Purpose                                                                      |
| ------------------- | ---------------------------------------------------------------------------- |
| **Qase.io**         | Test case management (Medications CRUD, Schedule flow, Calendar tests)       |
| **Postman**         | API tests for `/api/medications`, `/api/medications/search`, `/api/schedule` |
| **Chrome DevTools** | Inspect cookies/timezones, verify schedule rendering via API responses       |
| **GitHub**          | Version control for QA assets + pull-request reviews                         |

---

## 🔗 Postman Collection

**Location:**  
`/qa/sprint 2/postman/`

**Files included:**

- `mcs_mvp_medications_schedule.postman_collection.json` — medications CRUD + schedule APIs
- `mcs_mvp_sprint2_environment.json` — environment variables (base URLs, auth tokens)

**Endpoints covered:**

- `POST /api/medications/search` — prefix search ahead of creation wizard
- `POST /api/medications` — create medication with dose/form, duplicate detection
- `PATCH /api/medications/:id` — update medication fields
- `DELETE /api/medications/:id` — soft delete (deletedAt timestamp)
- `POST /api/schedule` — create schedule (quantity, frequencyDays, mealTiming, etc.)
- `POST /api/schedule/generate` — regenerate entries per scheduleId
- `GET /api/schedule?from&to&tz` — calendar feed for day/week view
- `PATCH /api/schedule/:id` — mark schedule entry `DONE`/`PLANNED`

**Purpose:**  
Validate the new medication search + wizard flow, ensure schedule creation generates entries with correct dates/times, and confirm calendar API exposes the enriched payload (quantity, units, meal timing).

---

## ✅ QA Artifacts Summary

| Category   | Artifact                                               | Format | Location                  |
| ---------- | ------------------------------------------------------ | ------ | ------------------------- |
| Test Suite | `Sprint2_Medications_Schedule.xlsx`                    | XLSX   | `qa/sprint 2/test-suite/` |
| Test Run   | `Sprint2_Run_Results.csv`                              | CSV    | `qa/sprint 2/test-runs/`  |
| Defects    | `PC-2025-11-23.csv`                                    | CSV    | `qa/sprint 2/defects/`    |
| API Tests  | `mcs_mvp_medications_schedule.postman_collection.json` | JSON   | `qa/sprint 2/postman/`    |

---

**QA Owner:** _Vladyslav Mazur_  
**Date:** _Sprint 2 (Weeks 3–4)_  
**Status:** 🚧 In progress — tracking Medications + Schedule feature readiness.
