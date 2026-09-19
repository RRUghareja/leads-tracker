import { SQL_NOW } from '../constants/constants';
import { LEAD_STATUS_VALUES } from '../constants/enums';
import type { Db } from './connection';

/** Built from the enum, so the database and the code can never disagree about valid statuses. */
const STATUS_LIST = LEAD_STATUS_VALUES.map((status) => `'${status}'`).join(', ');

/**
 * One lead has many notes (1:N). Deleting a lead removes its notes
 * through ON DELETE CASCADE, so the API never leaves orphaned rows.
 *
 * `position` is the manual sort order (lower comes first). New leads take the smallest position,
 * so they appear at the top until someone drags them elsewhere.
 *
 * Timestamps are stored as ISO-8601 UTC strings, which sort correctly as text.
 */
const SCHEMA = `
  CREATE TABLE IF NOT EXISTS leads (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    email      TEXT NOT NULL UNIQUE COLLATE NOCASE,
    phone      TEXT,
    status     TEXT NOT NULL DEFAULT 'new' CHECK (status IN (${STATUS_LIST})),
    position   INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (${SQL_NOW}),
    updated_at TEXT NOT NULL DEFAULT (${SQL_NOW})
  );

  CREATE TABLE IF NOT EXISTS notes (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    lead_id    INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    content    TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (${SQL_NOW})
  );

  CREATE INDEX IF NOT EXISTS idx_notes_lead_id ON notes(lead_id);
  CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
`;

function hasColumn(db: Db, table: string, column: string): boolean {
  return db.all(`PRAGMA table_info(${table})`).some((info) => info.name === column);
}

/**
 * Databases created before manual ordering have no `position` column. Add it and keep the order
 * people were already seeing (newest first) by numbering rows from the highest id downwards.
 */
function addPositionColumn(db: Db): void {
  if (hasColumn(db, 'leads', 'position')) return;

  db.exec(`
    ALTER TABLE leads ADD COLUMN position INTEGER NOT NULL DEFAULT 0;
    UPDATE leads SET position = -id;
  `);
}

/**
 * Databases created before "last updated" have no `updated_at` column. SQLite cannot add a column
 * with a time-based default, so it is added empty and every existing lead starts out "last updated"
 * on the day it was created.
 */
function addUpdatedAtColumn(db: Db): void {
  if (hasColumn(db, 'leads', 'updated_at')) return;

  db.exec(`
    ALTER TABLE leads ADD COLUMN updated_at TEXT;
    UPDATE leads SET updated_at = created_at;
  `);
}

/** Idempotent: safe to run on every startup. */
export function migrate(db: Db): void {
  db.exec(SCHEMA);
  addPositionColumn(db);
  addUpdatedAtColumn(db);
  db.exec('CREATE INDEX IF NOT EXISTS idx_leads_position ON leads(position)');
}
