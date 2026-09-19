import { mkdirSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { Database } from 'node-sqlite3-wasm';
import { IN_MEMORY_DATABASE } from '../constants/constants';

export type Db = Database;

/**
 * Opens (and if needed creates) the SQLite database.
 *
 * We use node-sqlite3-wasm rather than a native driver so that `npm install`
 * never needs a C++ toolchain or a matching prebuilt binary.
 */
export function createDatabase(file: string): Db {
  if (file !== IN_MEMORY_DATABASE) {
    const absolute = resolve(file);
    mkdirSync(dirname(absolute), { recursive: true });
    // The WASM driver guards the file with a `<file>.lock` directory. A process that was
    // killed (Ctrl+C, watcher restart) can leave it behind, and this app is the only writer.
    rmSync(`${absolute}.lock`, { recursive: true, force: true });
    file = absolute;
  }

  const db = new Database(file);
  db.exec('PRAGMA foreign_keys = ON');
  return db;
}

/** Runs `work` as one all-or-nothing unit: if it throws, none of its writes are kept. */
export function withTransaction<T>(db: Db, work: () => T): T {
  db.exec('BEGIN');

  try {
    const result = work();
    db.exec('COMMIT');
    return result;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}
