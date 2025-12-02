# 🧪 Sprint 3 – Profile Sharing & PDF Export QA

**Contents**

- `/defects` — Sprint 3 bug reports (share links, care access revocation, PDF export)
- `/test-suite` — Qase.io export/import for sharing and PDF scenarios
- `/test runs` — test run results for owner/viewer coverage
- `/postman` — API collection for share links, care access, and PDF export

---

## 🧰 Tools Used

| Tool                | Purpose                                                                    |
| ------------------- | -------------------------------------------------------------------------- |
| **Qase.io**         | Test case management (share links, care access lifecycle, PDF export)      |
| **Postman**         | API tests for `/api/share`, `/api/care-access`, `/api/export/pdf`          |
| **Chrome DevTools** | Inspect cookies/tokens, verify shared schedule payloads and PDF responses  |
| **GitHub**          | Version control for QA assets + pull-request reviews                       |

---

## 🔗 Postman Collection

**Location:**  
`/qa/sprint 3/postman/`

**Files included:**

- `goit-capstone-project-g5.postman_collection-3.json` — Profile sharing, care access, PDF export APIs

**Endpoints covered:**

- `POST /api/share` — Create share link for profile/schedule viewers
- `GET /api/share/status?status=active` — List active/expired share links
- `GET /api/share/validate?token={shareToken}` — Validate viewer token before acceptance
- `POST /api/share/accept` — Accept share invitation and create care access link
- `POST /api/share/revoke` — Revoke share link by token or ID
- `GET /api/care-access` — Retrieve care access relationships (owner/viewer)
- `DELETE /api/care-access?accessId={id}` — Revoke a viewer’s access
- `POST /api/export/pdf` — Export shared schedule to PDF

**Purpose:**  
Validate end-to-end profile sharing (create → validate → accept → revoke), ensure care access lists are accurate for owners/viewers, and confirm PDF exports render the shared schedule payload.

---

## ✅ QA Artifacts Summary

| Category   | Artifact                                                                                 | Format     | Location                    |
| ---------- | ---------------------------------------------------------------------------------------- | ---------- | --------------------------- |
| Test Suite | `PC-2025-12-02.xlsx`<br>`PC-2025-12-02.json`                                             | XLSX/JSON  | `qa/sprint 3/test-suite/`   |
| Test Run   | `PC-Test+run+2025_12_01.csv`<br>`PC-Test+run+2025_12_01.pdf`<br>`PC-Test+run+2025_12_02.csv`<br>`PC-Test+run+2025_12_02.pdf` | CSV/PDF    | `qa/sprint 3/test runs/`    |
| Defects    | `PC-2025-12-02.csv`                                                                      | CSV        | `qa/sprint 3/defects/`      |
| API Tests  | `goit-capstone-project-g5.postman_collection-3.json`                                     | JSON       | `qa/sprint 3/postman/`      |

---

**QA Owner:** _Vladyslav Mazur_  
**Date:** _Sprint 3 (Weeks 5–6)_  
**Status:** 🚧 In progress — validating Profile Sharing & PDF Export readiness.
