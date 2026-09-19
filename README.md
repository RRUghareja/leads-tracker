# Leads Tracker

A small lead-management app: a **REST API** (Node.js, Express, SQLite) and a **web portal** (Next.js), both written
in TypeScript.

- Manage leads (name, email, phone, status) and keep notes on each one.
- Search, filter by status, paginate, drag rows to reorder, clone, and see counts per status.
- Consistent JSON responses, validation with clear messages, proper HTTP status codes.
- Optional HTTP Basic auth, Jest tests, seed script, Dockerfile.

## Contents

[Quick start](#quick-start) · [Docker](#docker) · [Configuration](#configuration) · [Scripts](#scripts) ·
[API](#api) · [Web portal](#web-portal) · [Data model](#data-model) · [Project layout](#project-layout) ·
[Design decisions](#design-decisions) · [Tests](#tests)

## Quick start

Requires **Node.js 20 or newer**. No database server and no C++ compiler are needed.

```bash
npm install
npm run dev
```

| What       | URL                              |
| ---------- | -------------------------------- |
| Web portal | http://localhost:3000            |
| API        | http://localhost:4000            |
| Health     | http://localhost:4000/api/health |

The database file (`apps/api/data/leads.db`) is created on first start. To fill it with six sample leads and notes:

```bash
npm run seed
```

The seed script never touches a database that already has leads, so it is safe to run twice. You can also just
open the portal and press **New lead**.

## Docker

```bash
docker compose up --build
```

This builds and starts two containers, the API on port 4000 and the web portal on port 3000, and keeps the
database in a named volume (`leads-data`), so leads survive restarts. Add sample data with:

```bash
docker compose exec api node apps/api/dist/db/seed.js
```

The `Dockerfile` has two targets, so each image can also be built on its own:

```bash
docker build --target api -t leads-api .
docker build --target web -t leads-web .
```

To require a login, uncomment the `BASIC_AUTH_*`, `API_BASIC_AUTH_*` and `PORTAL_BASIC_AUTH_*` lines in
`docker-compose.yml` (see [Basic auth](#basic-auth)).

## Configuration

Everything is optional; the defaults work out of the box. Copy `apps/api/.env.example` to `apps/api/.env` and
`apps/web/.env.example` to `apps/web/.env.local` to change anything.

**API** (`apps/api`)

| Variable                              | Default                 | Meaning                                                    |
| ------------------------------------- | ----------------------- | ---------------------------------------------------------- |
| `PORT`                                | `4000`                  | Port the API listens on                                    |
| `DATABASE_PATH`                       | `data/leads.db`         | SQLite file. `:memory:` keeps everything in RAM (tests)    |
| `CORS_ORIGIN`                         | `http://localhost:3000` | Origin allowed to call the API from a browser              |
| `BASIC_AUTH_USER`, `BASIC_AUTH_PASSWORD` | _(empty = no auth)_  | Set **both** to require HTTP Basic auth on every `/api` route except `/api/health` |

**Web** (`apps/web`)

| Variable                                   | Default                 | Meaning                                                  |
| ------------------------------------------ | ----------------------- | -------------------------------------------------------- |
| `API_URL`                                  | `http://localhost:4000` | Where the API is. Only the Next.js server calls it       |
| `API_BASIC_AUTH_USER`, `API_BASIC_AUTH_PASSWORD` | _(empty)_         | The login the web server sends to the API, when the API has auth turned on |
| `PORTAL_BASIC_AUTH_USER`, `PORTAL_BASIC_AUTH_PASSWORD` | _(empty = no login)_ | Set **both** to make the browser ask for a login before showing any page |

## Scripts

Run from the repository root.

| Command             | What it does                                          |
| ------------------- | ----------------------------------------------------- |
| `npm run dev`       | Starts the API and the web app with live reload       |
| `npm run seed`      | Adds 6 sample leads (skipped if data already exists)  |
| `npm test`          | Runs the API test suite (Jest + Supertest)            |
| `npm run typecheck` | Type-checks both apps                                 |
| `npm run build`     | Production build of both apps                         |
| `npm start`         | Runs the production build (run `npm run build` first) |
| `npm run format`    | Formats the code with Prettier                        |

## API

Base URL `http://localhost:4000`. Send and receive JSON.

| Method   | Path                      | Purpose                                             | Success |
| -------- | ------------------------- | --------------------------------------------------- | ------- |
| `GET`    | `/api/health`             | Liveness and database check (always public)         | 200     |
| `GET`    | `/api/leads`              | List leads: `?search=&status=&page=&limit=`         | 200     |
| `POST`   | `/api/leads`              | Create a lead                                       | 201     |
| `GET`    | `/api/leads/:id`          | Get one lead                                        | 200     |
| `PATCH`  | `/api/leads/:id`          | Update some fields of a lead                        | 200     |
| `DELETE` | `/api/leads/:id`          | Delete a lead and its notes                         | 200     |
| `GET`    | `/api/leads/:id/notes`    | List a lead's notes, newest first                   | 200     |
| `POST`   | `/api/leads/:id/notes`    | Add a note to a lead                                | 201     |
| `GET`    | `/api/leads/stats`        | Counts in total and per status (`?search=` optional) | 200    |
| `POST`   | `/api/leads/:id/clone`    | Copy a lead (notes are not copied)                  | 201     |
| `PATCH`  | `/api/leads/reorder`      | Save a new order: `{ "ids": [3, 1, 2] }`            | 200     |

**Lead fields.** `name` (required, up to 120 characters), `email` (required, valid and unique, stored in lower
case), `phone` (optional), `status` (`new`, `contacted`, `qualified` or `lost`; default `new`). The API adds `id`,
`createdAt`, `updatedAt` and `position` (manual sort order).

**List parameters.** `search` matches name or email (case-insensitive), `status` filters, `page` starts at 1,
`limit` is 1 to 100 (default 10). Empty values such as `?search=&status=` are ignored.

### Examples

Every command below was run against a fresh, seeded API. Responses are shortened here.

**Health**

```bash
curl http://localhost:4000/api/health
```

```json
{ "success": true, "message": "Service is healthy",
  "data": { "status": "ok", "database": "up", "uptimeSeconds": 20, "timestamp": "2026-09-19T09:41:04.472Z" },
  "meta": null, "error": null }
```

**List, search and filter** (`GET /api/leads?search=&status=&page=&limit=`)

```bash
curl "http://localhost:4000/api/leads?limit=2"
curl "http://localhost:4000/api/leads?search=acme&status=new"
```

```json
{ "success": true, "message": "Leads fetched successfully",
  "data": [
    { "id": 1, "name": "Asha Patel", "email": "asha.patel@acme.example", "phone": "+91 98765 43210",
      "status": "new", "position": -1, "createdAt": "2026-09-19T09:40:39.926Z", "updatedAt": "2026-09-19T09:40:39.926Z" }
  ],
  "meta": { "page": 1, "limit": 10, "total": 1, "totalPages": 1 }, "error": null }
```

**Create a lead** (`POST /api/leads`, responds `201 Created` with a `Location` header)

```bash
curl -X POST http://localhost:4000/api/leads \
  -H "Content-Type: application/json" \
  -d '{"name":"Priya Nair","email":"priya@example.com","phone":"+91 90000 11111"}'
```

```json
{ "success": true, "message": "Lead created successfully",
  "data": { "id": 7, "name": "Priya Nair", "email": "priya@example.com", "phone": "+91 90000 11111",
            "status": "new", "position": -7, "createdAt": "2026-09-19T09:41:04.933Z", "updatedAt": "2026-09-19T09:41:04.933Z" },
  "meta": null, "error": null }
```

**Get one lead**

```bash
curl http://localhost:4000/api/leads/7
```

**Update a lead.** Send only the fields you want to change. `"phone": null` clears the phone number.

```bash
curl -X PATCH http://localhost:4000/api/leads/7 \
  -H "Content-Type: application/json" \
  -d '{"status":"contacted"}'
```

**Delete a lead** (its notes are deleted with it)

```bash
curl -X DELETE http://localhost:4000/api/leads/7
```

```json
{ "success": true, "message": "Lead deleted successfully", "data": null, "meta": null, "error": null }
```

**Add a note, then list notes** (newest first)

```bash
curl -X POST http://localhost:4000/api/leads/7/notes \
  -H "Content-Type: application/json" \
  -d '{"content":"Called, wants a demo next week."}'

curl http://localhost:4000/api/leads/7/notes
```

```json
{ "success": true, "message": "Notes fetched successfully",
  "data": [ { "id": 7, "leadId": 7, "content": "Called, wants a demo next week.", "createdAt": "2026-09-19T09:41:05.240Z" } ],
  "meta": null, "error": null }
```

**Counts per status** (used by the boxes at the top of the list)

```bash
curl http://localhost:4000/api/leads/stats
```

```json
{ "success": true, "message": "Lead statistics fetched successfully",
  "data": { "total": 6, "byStatus": { "new": 2, "contacted": 2, "qualified": 1, "lost": 1 } },
  "meta": null, "error": null }
```

**Clone a lead.** The copy is named "Name (copy)" and gets a tagged email (`priya+copy@example.com`), because emails
must be unique.

```bash
curl -X POST http://localhost:4000/api/leads/7/clone
```

**Reorder.** The leads listed swap among the positions they already hold, so leads that are not in the request keep
their place.

```bash
curl -X PATCH http://localhost:4000/api/leads/reorder \
  -H "Content-Type: application/json" \
  -d '{"ids":[1,2]}'
```

### Responses and errors

Every response, success or failure, has the same five keys. Values that do not apply are `null`, never missing.

```json
{ "success": true|false, "message": "...", "data": ..., "meta": ..., "error": ... }
```

| Status | When                                                            | `error.code`       |
| ------ | --------------------------------------------------------------- | ------------------ |
| 400    | Validation failed, malformed JSON, bad id (`/api/leads/abc`)    | `VALIDATION_ERROR` or `BAD_REQUEST` |
| 401    | Auth is on and credentials are missing or wrong                 | `UNAUTHORIZED`     |
| 404    | Lead does not exist, or unknown route                           | `NOT_FOUND`        |
| 409    | Email already used by another lead                              | `CONFLICT`         |
| 413    | Request body larger than 100 KB                                 | `PAYLOAD_TOO_LARGE`|
| 500    | Unexpected error (details are logged, never sent)               | `INTERNAL_ERROR`   |

Validation errors list every problem at once, so a form can show them all:

```bash
curl -X POST http://localhost:4000/api/leads -H "Content-Type: application/json" -d '{"email":"nope"}'
```

```json
{ "success": false, "message": "Request validation failed", "data": null, "meta": null,
  "error": { "code": "VALIDATION_ERROR", "details": [
    { "location": "body", "field": "name",  "message": "Name is required" },
    { "location": "body", "field": "email", "message": "Email must be a valid email address" } ] } }
```

Other cases you can try:

```bash
curl -i http://localhost:4000/api/leads/999          # 404  Lead not found
curl -i http://localhost:4000/api/leads/abc          # 400  id must be a positive integer
curl -i -X POST http://localhost:4000/api/leads/7/notes \
  -H "Content-Type: application/json" -d '{"content":"   "}'   # 400  Content is required (empty note)
curl -i -X PATCH http://localhost:4000/api/leads/7 \
  -H "Content-Type: application/json" -d '{}'                  # 400  Provide at least one field to update
```

### Basic auth

Set both variables and restart the API:

```bash
BASIC_AUTH_USER=admin BASIC_AUTH_PASSWORD=s3cret npm run dev -w apps/api
```

```bash
curl http://localhost:4000/api/leads                     # 401, with a WWW-Authenticate header
curl -u admin:s3cret http://localhost:4000/api/leads     # 200
curl http://localhost:4000/api/health                    # 200 (health is always public)
```

There are two independent logins, both off by default:

| Protects           | Set these variables                                  | Where                |
| ------------------ | ---------------------------------------------------- | -------------------- |
| The **API**        | `BASIC_AUTH_USER`, `BASIC_AUTH_PASSWORD`             | `apps/api/.env`      |
| The **web portal** | `PORTAL_BASIC_AUTH_USER`, `PORTAL_BASIC_AUTH_PASSWORD` | `apps/web/.env.local` |

With the portal login on, the browser shows its own sign-in prompt before any page is served. If the API is also
protected, give the web server its login through `API_BASIC_AUTH_USER` and `API_BASIC_AUTH_PASSWORD`. The browser
never talks to the API directly, so the API password is never sent to it. Setting only one of a pair is treated as a
mistake: the portal refuses every request (HTTP 500 with an explanation) instead of silently staying open, and the
API refuses to start.

Example, protecting everything with the same login:

```bash
# apps/api/.env
BASIC_AUTH_USER=admin
BASIC_AUTH_PASSWORD=s3cret

# apps/web/.env.local
API_BASIC_AUTH_USER=admin
API_BASIC_AUTH_PASSWORD=s3cret
PORTAL_BASIC_AUTH_USER=admin
PORTAL_BASIC_AUTH_PASSWORD=s3cret
```

## Web portal

| Page                  | What you can do                                                                                   |
| --------------------- | ------------------------------------------------------------------------------------------------- |
| `/leads`              | Status boxes, live search, status filter, rows per page (presets or any number 1-100), pagination |
|                       | Drag the handle at the start of a row to reorder. Row actions: Overview (popup with notes), Edit, Clone, Delete |
| `/leads/new`          | Create a lead, with validation messages under each field                                          |
| `/leads/:id`          | Details, status change, and the notes (add as many as you like)                                   |
| `/leads/:id/edit`     | Edit the lead's fields                                                                            |

Search and filters live in the URL, so any view can be bookmarked or shared. A missing lead shows a proper 404 page.

## Data model

```
leads                                   notes
-----                                   -----
id          INTEGER PK                  id          INTEGER PK
name        TEXT NOT NULL               lead_id     INTEGER NOT NULL  -> leads.id  ON DELETE CASCADE
email       TEXT NOT NULL UNIQUE (NOCASE)   content   TEXT NOT NULL
phone       TEXT                        created_at  TEXT NOT NULL (ISO-8601, UTC)
status      TEXT CHECK (new | contacted | qualified | lost)
position    INTEGER (manual order)
created_at  TEXT   updated_at  TEXT
```

One lead has many notes. Deleting a lead removes its notes through the foreign key, so there are never orphaned rows.
Databases created by an older version are upgraded automatically at startup (see `apps/api/src/db/migrate.ts`).

## Project layout

```
apps/
  api/                       Express + SQLite
    src/
      constants/             enums.ts, constants.ts, messages.ts  (every fixed value and message)
      types/common.types.ts  Types shared between modules
      config/env.ts          Validated environment variables
      db/                    Connection, migrations, seed script
      middleware/            validate, errorHandler, basicAuth, requestLogger
      modules/<feature>/     <feature>.types | schema | repository | service | controller | routes
      utils/                 common helpers, response.ts, AppError, logger, shared Zod rules
      app.ts                 createApp({ config, db }): no side effects, easy to test
      server.ts              Process entrypoint and graceful shutdown
    tests/                   Jest tests, each against a fresh in-memory database
  web/                       Next.js (App Router)
    src/
      constants/             enums.ts, constants.ts, messages.ts  (all UI text)
      types/                 common.types.ts, lead.types.ts, note.types.ts
      lib/                   Typed API client, ApiError, helpers, config
      app/                   Routes, server actions, error and not-found pages
      components/            List, toolbar, forms, popup, icons
Dockerfile, docker-compose.yml
```

## Design decisions

- **Layers.** Each API feature is routes, controller, service, repository. Controllers only speak HTTP, services hold
  the rules (unique email, cloning, reordering), and repositories are the only place with SQL.
- **One response shape.** `sendSuccess` and `sendError` in `utils/response.ts` are the only writers, so no endpoint
  can drift from the format.
- **Validation in one place.** Zod schemas are reusable building blocks, applied by one `validate()` middleware that
  reports every problem at once and normalises input (trimmed text, lower-case email, numbers as numbers).
- **Constants, enums and messages each live in one file**, so wording, limits and status values are never
  duplicated. The database `CHECK` constraint is built from the same `LeadStatus` enum the code uses.
- **Explicit nulls.** A missing value is `null` in the database, the repositories and the responses, never `undefined`.
- **No native build step.** SQLite runs through `node-sqlite3-wasm` (real SQLite compiled to WebAssembly), so
  `npm install` works on any OS and Node version without Visual Studio or Python.
- **Testable by construction.** `createApp` receives its dependencies, so every test gets a private in-memory
  database and tests can run in parallel.
- **The browser never calls the API.** Only the Next.js server does, which keeps the optional API password out of
  the browser and avoids CORS issues.
- **Searching is safe.** `%` and `_` in a search are matched literally, and all SQL uses bound parameters.
- **Edits that must not be lost or half-done are atomic.** Reordering runs in one transaction.

### Notes and assumptions

- Emails are unique (case-insensitive), so creating or editing a lead with a taken address returns `409`.
- `updatedAt` changes when a lead's own fields change. Reordering, adding a note, or cloning does not change it.
- Cloning does not copy notes, because they are the history of one conversation.
- Pagination and ordering: leads are ordered by their `position`; new leads appear at the top.

## Tests

```bash
npm test
```

77 tests (Jest + Supertest) cover every endpoint: success paths, validation errors, 404 for a missing lead, duplicate
emails, empty notes, search and filter (including `%` and `_`), pagination, reordering, cloning, stats, basic auth,
and the database upgrade for old databases. Tests run against an in-memory database and need no setup.
