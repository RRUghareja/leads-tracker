import type { Db } from '../../db/connection';
import type { Note } from './note.types';

const COLUMNS = 'id, lead_id AS leadId, content, created_at AS createdAt';

export class NoteRepository {
  constructor(private readonly db: Db) {}

  /** Newest first, so the latest conversation is at the top. */
  findByLeadId(leadId: number): Note[] {
    return this.db.all(
      `SELECT ${COLUMNS} FROM notes WHERE lead_id = ? ORDER BY created_at DESC, id DESC`,
      [leadId],
    ) as unknown as Note[];
  }

  insert(leadId: number, content: string): Note {
    const result = this.db.run('INSERT INTO notes (lead_id, content) VALUES (?, ?)', [
      leadId,
      content,
    ]);

    return this.db.get(`SELECT ${COLUMNS} FROM notes WHERE id = ?`, [
      Number(result.lastInsertRowid),
    ]) as unknown as Note;
  }
}
