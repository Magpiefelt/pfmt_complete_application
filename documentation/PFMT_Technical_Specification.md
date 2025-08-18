# PFMT – Detailed Technical Specification (dev-only snapshot)

**Date:** Aug 17, 2025
**Owner:** GOA / PFMT
**Scope:** End-to-end technical specification for the current (dev-only) PFMT application. Targets: developers, DevOps, QA. Production hardening items called out explicitly.

---

## 1) Executive summary

* PFMT is a full-stack web app: **Vue 3 + Vite** frontend, **Node.js/Express** backend, **PostgreSQL** database.
* The repo includes **Dockerfiles** and scripts for local/dev, plus docs for PM2/Nginx deployment. Compose files are referenced; ensure they’re committed and in sync with the scripts.
* The current repo state is suitable for **development usage only**; production gating items are enumerated below.

---

## 2) System architecture

### 2.1 Logical overview

* **Frontend**: Vue 3 SPA (Vite dev server in dev; static assets via Nginx in prod). Client-side routing with lazy-loaded route components.
* **Backend**: Node.js/Express service exposing REST endpoints (auth, projects, gate meetings, versions, vendors, users, health).
* **Database**: PostgreSQL with application schema and migration scripts. Some fix/migration SQL is present to align Dockerized DBs with expected schema.

### 2.2 Deployment topologies

* **Dev:** Vite on port 5173; Express on 3002; Postgres local/Docker.
* **Prod (target design):** Static frontend served by Nginx; backend process managed by PM2; Postgres with pooling.

### 2.3 Containers & images

* **frontend.Dockerfile** implements a multi-stage build (Node 20-alpine → Nginx), adds security headers and a `/health` endpoint via Nginx config.
* **frontend/Dockerfile** (duplicate alt) also builds SPA and serves with Nginx using a non-root user.
* **Docker compose**: dev/prod compose files are referenced by scripts; ensure `docker/docker-compose.dev.yml` and `docker/docker-compose.prod.yml` exist and match service names/volumes used by scripts.

---

## 3) Environments & configuration

### 3.1 Environment variables

**Backend (.env)**

* Database: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
* App: `JWT_SECRET`, `PORT`, `NODE_ENV`
* Auto-submission: `AUTO_SUBMISSION_ENABLED`, `AUTO_SUBMISSION_CRON`, `AUTO_SUBMISSION_MIN_AGE_DAYS`
* Optional email: `NOTIFICATION_EMAIL`, `SMTP_*`

**Frontend (.env)**

* `VITE_API_BASE_URL` (e.g., `/api`)
* `VITE_APP_TITLE`

### 3.2 Ports & bindings

* Frontend dev: 5173
* Backend: 3002
* Frontend prod (Nginx): 80 inside container; expose as needed.

### 3.3 Secrets

* **Do not** commit `.env` files. In prod use a secrets manager (e.g., Kubernetes Secrets, SSM Parameter Store, Vault) with per-env rotation.

---

## 4) Database

### 4.1 Schema & migrations

* Migrations are stored under `database/migrations` and executed in lexical order. Current files include `001_add_lifecycle_status.sql` and `002_complete_docker_fix.sql` which reconciles missing tables/columns (`project_wizard_step_data`, `vendors` augmentations, `project_templates.status`).
* Action items:

  1. Inventory actual `database/migrations/*.sql` and verify order.
  2. Ensure compose initialization mounts run migrations on first boot.
  3. Replace any remaining ad-hoc SQL with idempotent migrations checked into source control.

### 4.2 Seed data

* Provide minimal working seeds for local dev accounts, sample projects, and vendors. Ensure seeds match the evolved schema. Sample seed scripts live under `database/sample_data.sql`.

### 4.3 Operational safeguards

* Backups via `pg_dump` and scripted restore; in prod, schedule daily logical backups and enable PITR if using managed Postgres.

---

## 5) Backend service

### 5.1 Tech stack

* Node 20 runtime, Express 4.x.
* Structure: `app.js` (route registration, health), `controllers/`, `routes/`, `middleware/`, `config/database.js`.

### 5.2 Key endpoints

* **Health**: `/health`, `/health/db`.
* **Gate Meetings**: `GET /api/gate-meetings/upcoming`, `POST /api/gate-meetings`, `PATCH /api/gate-meetings/:id`, `GET /api/gate-meetings/:projectId`.
* **Project Versions (Phase 2 pathing)**: `GET/POST /api/phase2/projects/:id/versions` (and related).
* **Scheduled submissions** (admin/director): e.g., `/api/scheduled-submissions/trigger`, `/config`, `/history`.
* **Users/Vendors**: endpoints present per docs; verify routes and controller coverage against README/API doc.

### 5.3 Authentication & authorization

* JWT-based authentication; role-based access control (PM/SPM, Director, Vendor).
* **Dev-only note:** if a bypass flag existed previously, ensure it is **off** by default. Confirm all routes enforce auth/role checks.

### 5.4 Validation & errors

* Validation utilities for wizard steps (server-side); respond with normalized error payloads.
* Adopt a consistent error envelope `{ error: { code, message, details } }` and map to proper HTTP status.

### 5.5 Observability

* Add request logging (morgan/winston) with correlation IDs.
* Health endpoints above; add `/ready` and `/live` if using Kubernetes.

---

## 6) Frontend application

### 6.1 Tech stack

* Vue 3 + Vite, TypeScript, Vue Router. SPA with lazy-loaded routes.

### 6.2 State & business logic

* Composables encapsulate business rules (e.g., gate meetings, versions). Service classes abstract API calls. Components are slimmer and reactive via `ref`/`computed`.

### 6.3 UX flows (current)

* **Dual-wizard system** (role-aware steps).
* **Versioning model**: one approved + one draft per project; draft indicators in listings.
* **Improved validation and error display**.

### 6.4 Build output

* `vite build` → `/dist` folder; served by Nginx in container.

---

## 7) Dev workflow

### 7.1 Local dev

1. Backend: `npm install`, create `.env`, run migrations, `npm run dev` with `DEBUG=*` as needed.
2. Frontend: `npm install`, `.env` with API base, `npm run dev`.
3. Database: local Postgres or Docker.

### 7.2 Dockerized dev

* Use the scripts to bring up dev stack. Confirm compose files exist and mount source for hot-reload (frontend) and bind volumes for Postgres data/init SQL.

### 7.3 CI/CD

* Frontend CI includes type-check, lint, unit tests, build, optional Playwright E2E on PRs, and security/audit steps.
* Backend CI: add parallel pipeline (lint, tests, build, SCA, container build) to align with frontend.

---

## 8) Security

* JWT secret management via secret store; rotate quarterly.
* Nginx adds security headers (click-jacking, XSS, MIME sniffing, referrer policy).
* Server-side input validation; defense-in-depth on authorization.
* Use rate limiting on auth and mutation endpoints.
* Ensure CORS is restricted to trusted origins in prod.
* Run containers as non-root (already configured in frontend image).

---

## 9) Performance

* Lazy-loaded routes; component splitting; computed reactivity patterns.
* Indexes for lifecycle/status queries; paginate large lists.
* Consider connection pooling (pg-pool), and HTTP keep-alive.

---

## 10) Known issues & limitations (dev-only state)

1. **Compose files referenced but not verified** in repo snapshot. Ensure `docker/docker-compose.dev.yml` and `docker/docker-compose.prod.yml` are present and correct.
2. **Schema reconciliation**: fix/migration SQL exists out-of-band; convert to first-class migrations and ensure dev/CI applies them deterministically.
3. **Backend CI coverage**: currently frontend-heavy; add backend tests and security scans.
4. **Secrets**: no production secrets integration shown; add.
5. **Auth bypass**: confirm no dev bypass flags are enabled by default.
6. **Telemetry**: add structured logging and distributed tracing IDs; deploy log shipping in prod.

---

## 11) Hardening plan to production (actionable)

### P0 (blockers)

* [ ] Commit & validate compose files; align service names/ports/volumes.
* [x] Replace `COMPLETE_DOCKER_FIX.sql` with ordered, idempotent migrations (`001_add_lifecycle_status.sql`, `002_complete_docker_fix.sql`).
* [ ] Enforce JWT/roles on every route; remove any bypass; add rate limiting + CORS hardening.
* [ ] Backend CI: lint, unit/integration tests, SCA, container build & scan.

### P1 (recommended before pilot)

* [ ] Add `/ready` and `/live` endpoints; readiness checks in Nginx/K8s.
* [ ] Seed users and sample data; scripted E2E smoke.
* [ ] Centralized logging; error budget/SLO draft (e.g., 99.9% for API).
* [ ] PM2 or orchestrator manifests; blue/green or rolling strategy.

### P2 (post-pilot)

* [ ] Performance profiling; DB query optimization; caching strategy.
* [ ] Storybook for shared components; visual regression tests.
* [ ] Threat modeling & pen-test remediation.

---

## 12) Test strategy

* **Unit**: composables, services, validation utils.
* **Integration**: service + composable + component; mock API.
* **E2E**: Playwright flows for login → wizard → version submit → director approval → listing indicators.
* **Contract**: add Pact tests for key API payloads.

---

## 13) Appendices

### A) Health checks (manual)

* Backend: `curl :3002/health` and `:3002/health/db`
* Frontend (Nginx): `curl :80/health` inside container

### B) Sample `.env` templates

* Backend and frontend variable lists (see §3.1) – provide environment-specific values via secret stores.

### C) Scripts of interest

* `scripts/clean.sh` – teardown images/volumes (⚠ deletes DB data).
* `fix_query_import.cmd` – temporary script to add a missing import to `projectWizardController.js` (should be replaced by committing the fixed code).

### D) Data model highlights

* `projects`, `project_versions` (single approved + single draft), `gate_meetings`, `vendors` (+ added columns), `project_templates.status`, `project_wizard_step_data` (session-scoped step storage).

---

## 14) "Since last delivery" – changes captured in repo docs

* Dual-wizard system, status model refinements, validation and persistence fixes.
* Lifecycle/status indexing; API additions; documentation & troubleshooting guides.
* CI additions for the frontend; security headers in Nginx; multi-stage frontend image.

---

### Sign-off & next steps

* Review/confirm compose files and migration order.
* Implement P0 hardening tasks and re-run end-to-end validation.
* Prepare a short pilot deployment plan (canary environment) after P0 passes.

