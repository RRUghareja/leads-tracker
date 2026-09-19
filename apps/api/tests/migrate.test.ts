import { IN_MEMORY_DATABASE } from '../src/constants/constants';
import { createDatabase } from '../src/db/connection';
import { migrate } from '../src/db/migrate';

describe('migrate', () => {
  it('is safe to run more than once', () => {
    const db = createDatabase(IN_MEMORY_DATABASE);

    expect(() => {
      migrate(db);
      migrate(db);
    }).not.toThrow();
  });

  it('upgrades a database created before manual ordering, keeping newest first', () => {
    const db = createDatabase(IN_MEMORY_DATABASE);
    db.exec(`
      CREATE TABLE leads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE COLLATE NOCASE,
        phone TEXT,
        status TEXT NOT NULL DEFAULT 'new',
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
      );
      INSERT INTO leads (name, email) VALUES ('Old One', 'one@example.com');
      INSERT INTO leads (name, email) VALUES ('Old Two', 'two@example.com');
      INSERT INTO leads (name, email) VALUES ('Old Three', 'three@example.com');
    `);

    migrate(db);

    const names = db
      .all('SELECT name FROM leads ORDER BY position ASC, id DESC')
      .map((r) => r.name);
    expect(names).toEqual(['Old Three', 'Old Two', 'Old One']);
  });

  it('gives leads from before "last updated" an updated_at equal to their created_at', () => {
    const db = createDatabase(IN_MEMORY_DATABASE);
    db.exec(`
      CREATE TABLE leads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE COLLATE NOCASE,
        phone TEXT,
        status TEXT NOT NULL DEFAULT 'new',
        created_at TEXT NOT NULL
      );
      INSERT INTO leads (name, email, created_at)
        VALUES ('Old One', 'one@example.com', '2026-01-02T03:04:05.000Z');
    `);

    migrate(db);
    migrate(db); // running it again must not fail or overwrite anything

    const row = db.get('SELECT created_at, updated_at FROM leads');
    expect(row?.updated_at).toBe('2026-01-02T03:04:05.000Z');
    expect(row?.updated_at).toBe(row?.created_at);
  });
});
