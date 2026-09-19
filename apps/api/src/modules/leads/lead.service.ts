import { FIELD_LIMITS } from '../../constants/constants';
import { LEAD_STATUS_VALUES, type LeadStatus } from '../../constants/enums';
import { MESSAGES } from '../../constants/messages';
import type { Paginated } from '../../types/common.types';
import { AppError } from '../../utils/AppError';
import { addEmailTag, appendWithinLimit, buildPaginationMeta, toOffset } from '../../utils/common';
import type { LeadRepository } from './lead.repository';
import type {
  Lead,
  LeadChanges,
  LeadStats,
  LeadStatsQuery,
  ListLeadsQuery,
  NewLead,
} from './lead.types';

const COPY_NAME_SUFFIX = ' (copy)';

/** Business rules for leads. Knows nothing about HTTP, so it is easy to reuse (e.g. by the seed script). */
export class LeadService {
  constructor(private readonly leads: LeadRepository) {}

  list({ page, limit, search, status }: ListLeadsQuery): Paginated<Lead> {
    const filters = { search, status };
    const total = this.leads.count(filters);
    const data = this.leads.findMany(filters, limit, toOffset(page, limit));

    return { data, meta: buildPaginationMeta(page, limit, total) };
  }

  /** Totals for the summary boxes. Statuses with no leads still appear, as 0. */
  stats({ search }: LeadStatsQuery): LeadStats {
    const byStatus = Object.fromEntries(LEAD_STATUS_VALUES.map((status) => [status, 0])) as Record<
      LeadStatus,
      number
    >;

    for (const { status, total } of this.leads.countByStatus(search)) byStatus[status] = total;

    const total = Object.values(byStatus).reduce((sum, count) => sum + count, 0);

    return { total, byStatus };
  }

  get(id: number): Lead {
    const lead = this.leads.findById(id);
    if (!lead) throw AppError.notFound(MESSAGES.ERROR.LEAD_NOT_FOUND);

    return lead;
  }

  create(input: NewLead): Lead {
    this.assertEmailAvailable(input.email);

    return this.leads.insert(input);
  }

  update(id: number, changes: LeadChanges): Lead {
    this.get(id); // 404 before anything else

    if (changes.email !== undefined) this.assertEmailAvailable(changes.email, id);

    return this.leads.update(id, changes) as Lead;
  }

  remove(id: number): void {
    if (!this.leads.delete(id)) throw AppError.notFound(MESSAGES.ERROR.LEAD_NOT_FOUND);
  }

  /**
   * Copies a lead's details into a new lead at the top of the list. Notes are not copied: they are
   * the history of one conversation. Emails must be unique, so the copy gets a tagged address
   * (asha+copy@acme.com, then asha+copy2@acme.com, ...) that the user can edit afterwards.
   */
  clone(id: number): Lead {
    const source = this.get(id);

    return this.leads.insert({
      name: appendWithinLimit(source.name, COPY_NAME_SUFFIX, FIELD_LIMITS.NAME_MAX),
      email: this.uniqueCopyEmail(source.email),
      phone: source.phone,
      status: source.status,
    });
  }

  /**
   * Saves a new top-to-bottom order for the given leads. They swap among the positions they already
   * occupy, so leads that are not part of the request (other pages, filtered-out rows) stay put.
   */
  reorder(ids: number[]): Lead[] {
    const existing = this.leads.findByIds(ids);
    if (existing.length !== ids.length) throw AppError.notFound(MESSAGES.ERROR.LEAD_NOT_FOUND);

    const slots = existing.map((lead) => lead.position).sort((a, b) => a - b);
    this.leads.updatePositions(ids.map((id, index) => ({ id, position: slots[index] as number })));

    return this.leads.findByIds(ids);
  }

  private uniqueCopyEmail(email: string): string {
    for (let attempt = 1; ; attempt += 1) {
      const candidate = addEmailTag(email, attempt === 1 ? 'copy' : `copy${attempt}`);
      if (!this.leads.findByEmail(candidate)) return candidate;
    }
  }

  /** Emails are unique. `ignoreId` lets a lead keep its own address when it is edited. */
  private assertEmailAvailable(email: string, ignoreId?: number): void {
    const existing = this.leads.findByEmail(email);

    if (existing && existing.id !== ignoreId) {
      throw AppError.conflict(MESSAGES.ERROR.EMAIL_TAKEN(email));
    }
  }
}
