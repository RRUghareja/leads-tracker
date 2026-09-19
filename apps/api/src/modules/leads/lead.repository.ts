import { SQL_NOW } from '../../constants/constants';
import type { LeadStatus } from '../../constants/enums';
import { withTransaction, type Db } from '../../db/connection';
import { escapeLike } from '../../utils/common';
import type { Lead, LeadChanges, LeadFilters, NewLead, PositionAssignment } from './lead.types';

/** created_at is exposed to the API as createdAt. */
const COLUMNS = `id, name, email, phone, status, position,
  created_at AS createdAt, COALESCE(updated_at, created_at) AS updatedAt`;

/** Manual order first; ties (which only happen for identical positions) fall back to newest. */
const ORDER = 'ORDER BY position ASC, id DESC';

/** Fields a client may change, mapped to their column. Guards the dynamic UPDATE below. */
const UPDATABLE_COLUMNS: Record<keyof LeadChanges, string> = {
  name: 'name',
  email: 'email',
  phone: 'phone',
  status: 'status',
};

function buildWhere({ search, status }: LeadFilters): { sql: string; params: string[] } {
  const clauses: string[] = [];
  const params: string[] = [];

  if (search) {
    const pattern = `%${escapeLike(search)}%`;
    clauses.push(`(name LIKE ? ESCAPE '\\' OR email LIKE ? ESCAPE '\\')`);
    params.push(pattern, pattern);
  }

  if (status) {
    clauses.push('status = ?');
    params.push(status);
  }

  return { sql: clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '', params };
}

/** All SQL for the leads table lives here. "Not found" is always `null`, never `undefined`. */
export class LeadRepository {
  constructor(private readonly db: Db) {}

  findMany(filters: LeadFilters, limit: number, offset: number): Lead[] {
    const where = buildWhere(filters);

    return this.db.all(`SELECT ${COLUMNS} FROM leads ${where.sql} ${ORDER} LIMIT ? OFFSET ?`, [
      ...where.params,
      limit,
      offset,
    ]) as unknown as Lead[];
  }

  findByIds(ids: number[]): Lead[] {
    if (ids.length === 0) return [];

    const placeholders = ids.map(() => '?').join(', ');

    return this.db.all(
      `SELECT ${COLUMNS} FROM leads WHERE id IN (${placeholders}) ${ORDER}`,
      ids,
    ) as unknown as Lead[];
  }

  count(filters: LeadFilters): number {
    const where = buildWhere(filters);
    const row = this.db.get(`SELECT COUNT(*) AS total FROM leads ${where.sql}`, where.params);

    return Number(row?.total ?? 0);
  }

  /** Leads per status (only statuses that have leads appear), optionally limited to a search. */
  countByStatus(search?: string): { status: LeadStatus; total: number }[] {
    const where = buildWhere({ search });

    return this.db
      .all(`SELECT status, COUNT(*) AS total FROM leads ${where.sql} GROUP BY status`, where.params)
      .map((row) => ({ status: row.status as LeadStatus, total: Number(row.total) }));
  }

  findById(id: number): Lead | null {
    return this.db.get(`SELECT ${COLUMNS} FROM leads WHERE id = ?`, [id]) as unknown as Lead | null;
  }

  findByEmail(email: string): Lead | null {
    return this.db.get(`SELECT ${COLUMNS} FROM leads WHERE email = ?`, [
      email,
    ]) as unknown as Lead | null;
  }

  /** New leads go to the top: one step before the current first position. */
  insert(lead: NewLead): Lead {
    const result = this.db.run(
      // Both timestamps are written explicitly so they match, even on databases upgraded from
      // before "last updated" existed (where the column has no default).
      `INSERT INTO leads (name, email, phone, status, position, created_at, updated_at)
       VALUES (?, ?, ?, ?, (SELECT COALESCE(MIN(position), 0) - 1 FROM leads), ${SQL_NOW}, ${SQL_NOW})`,
      [lead.name, lead.email, lead.phone, lead.status],
    );

    return this.findById(Number(result.lastInsertRowid)) as Lead;
  }

  update(id: number, changes: LeadChanges): Lead | null {
    const entries = (Object.keys(UPDATABLE_COLUMNS) as (keyof LeadChanges)[])
      .filter((key) => changes[key] !== undefined)
      .map((key) => [UPDATABLE_COLUMNS[key], changes[key] as string | null] as const);

    if (entries.length > 0) {
      // Only real edits touch updated_at. Dragging a lead to a new position does not.
      const assignments = [
        ...entries.map(([column]) => `${column} = ?`),
        `updated_at = ${SQL_NOW}`,
      ];
      this.db.run(`UPDATE leads SET ${assignments.join(', ')} WHERE id = ?`, [
        ...entries.map(([, value]) => value),
        id,
      ]);
    }

    return this.findById(id);
  }

  /** Writes several positions atomically, so a failure never leaves the list half-reordered. */
  updatePositions(assignments: PositionAssignment[]): void {
    withTransaction(this.db, () => {
      for (const { id, position } of assignments) {
        this.db.run('UPDATE leads SET position = ? WHERE id = ?', [position, id]);
      }
    });
  }

  /** Returns false when no such lead existed. Notes are removed by ON DELETE CASCADE. */
  delete(id: number): boolean {
    return this.db.run('DELETE FROM leads WHERE id = ?', [id]).changes > 0;
  }
}
