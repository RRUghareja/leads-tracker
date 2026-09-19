# Leads Tracker

A small lead-management app: an **Express + SQLite REST API** and a **Next.js web portal**, written in TypeScript.

> Status: leads + notes API and web portal are complete. Dockerfile and full API docs are coming next.

## Quick start

Requires Node.js 20 or newer.

```bash
npm install
npm run dev
```

- Web portal: http://localhost:3000
- API: http://localhost:4000 (health check: `GET /api/health`)

No configuration is needed. Optional settings live in `apps/api/.env.example` and `apps/web/.env.example`.

## Scripts

| Command             | What it does                                 |
| ------------------- | -------------------------------------------- |
| `npm run dev`       | Starts the API and the web app with reload   |
| `npm run seed`      | Adds 6 sample leads (skipped if data exists) |
| `npm test`          | Runs the API test suite (Jest + Supertest)   |
| `npm run typecheck` | Type-checks both apps                        |
| `npm run build`     | Production build of both apps                |
| `npm start`         | Runs the production build                    |

## Project layout

```
apps/
  api/                       Express + SQLite
    src/
      constants/
        enums.ts             Every fixed set of values (LeadStatus, HttpStatus, ErrorCode, ...)
        constants.ts         Routes, defaults, limits, patterns
        messages.ts          Every response and log message
      types/common.types.ts  Types shared between modules (ApiResponse, Paginated, AppConfig, ...)
      config/env.ts          Validated environment variables
      db/                    Connection, idempotent migrations, seed
      middleware/            validate, errorHandler, basicAuth, requestLogger
      modules/<feature>/     <feature>.types | schema | repository | service | controller | routes
      utils/
        common.ts            Shared helpers (orNull, emptyToNull, escapeLike, pagination, ...)
        response.ts          sendSuccess / sendError - the only way a response is written
        AppError.ts, logger.ts, validation.ts
      app.ts                 createApp({ config, db }) - no side effects, easy to test
      server.ts              Process entrypoint + graceful shutdown
    tests/                   Jest tests using an in-memory database
  web/                       Next.js (App Router)
    src/
      constants/             enums.ts, constants.ts, messages.ts (all UI text)
      types/                 common.types.ts, lead.types.ts, note.types.ts
      lib/                   common.ts helpers, typed API client, ApiError, config
      app/                   Routes, layout, error / not-found boundaries
      components/            Shared UI
```

## API response format

Every response, success or error, has the same five keys. Values that do not apply are `null`, never missing.

```json
{ "success": true, "message": "Leads fetched successfully", "data": [], "meta": { "page": 1, "limit": 10, "total": 6, "totalPages": 1 }, "error": null }
{ "success": true, "message": "Lead deleted successfully", "data": null, "meta": null, "error": null }
{ "success": false, "message": "Lead not found", "data": null, "meta": null, "error": { "code": "NOT_FOUND", "details": null } }
```

Status codes used: 200, 201 (created), 400 (validation), 401, 404, 409 (duplicate email), 500.

## Ordering, cloning and row actions

- **Drag to reorder.** Each row has a drag handle (mouse, touch and keyboard). The order is saved in a
  `position` column through `PATCH /api/leads/reorder` with `{ "ids": [3, 1, 2] }`. The leads in the request swap
  among the positions they already hold, so other pages and filtered-out rows are never disturbed. New leads
  appear at the top. Databases created before this feature are upgraded automatically on startup.
- **Clone.** `POST /api/leads/:id/clone` copies a lead to the top of the list as "Name (copy)". Emails must be
  unique, so the copy gets a tagged address (`asha+copy@acme.com`, then `asha+copy2@acme.com`). Notes are not
  copied. The web app opens the copy in the edit form.
- **Last updated.** Every lead has `createdAt` and `updatedAt` (ISO-8601, UTC). `updatedAt` moves forward when
  the lead's own fields change (name, email, phone or status). Dragging a lead, adding a note or cloning it
  does not change the original's `updatedAt`. Leads from before this feature start with `updatedAt` equal to
  `createdAt`.
- **Status boxes.** The top of the list shows how many leads there are in total and per status (New, Contacted,
  Qualified, Lost). Each box is a link that filters the list, and the current one is highlighted. The numbers come
  from `GET /api/leads/stats`, which returns `{ "total": 12, "byStatus": { "new": 3, "contacted": 5, ... } }`
  with every status present, even at 0. It accepts the same `?search=` as the list, so the boxes follow what
  you have searched for.
- **Actions column.** Every row offers Overview (a popup with the lead's details, no page change), Edit, Clone and
  Delete. Clicking the lead's name opens its full page with the notes.

## Design decisions

- **Constants, enums and messages in one place each.** No string literals for statuses, error codes or
  messages scattered through the code.
- **One response shape.** `sendSuccess` and `sendError` in `utils/response.ts` are the only writers, so no
  endpoint can drift from the format.
- **Validation in one place.** Zod schemas are reusable building blocks (`utils/validation.ts`) applied by the
  `validate()` middleware, which reports every problem at once.
- **Explicit nulls.** Missing values are `null` in the database, repositories and responses (never
  `undefined`).
- **No native build step.** SQLite runs through `node-sqlite3-wasm`, so `npm install` works without a C++
  toolchain on any OS.
- **Testable by construction.** `createApp` receives its dependencies, so tests run against a fresh in-memory
  database.
- **Browser never calls the API directly.** Only the Next.js server does, which keeps optional API
  credentials out of the client.
