import type { LeadStatus } from '../../constants/enums';
import type {
  CreateLeadSchema,
  LeadStatsQuerySchema,
  ListLeadsQuerySchema,
  ReorderLeadsSchema,
  UpdateLeadSchema,
} from './lead.schema';

export type Lead = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  status: LeadStatus;
  /** Manual sort order. Lower comes first. Changed by dragging rows in the web app. */
  position: number;
  createdAt: string;
  /** When the lead's own fields (name, email, phone, status) last changed. Starts equal to createdAt. */
  updatedAt: string;
};

export type NewLead = Pick<Lead, 'name' | 'email' | 'phone' | 'status'>;

/** Only the fields present are changed; `phone: null` clears the phone number. */
export type LeadChanges = Partial<NewLead>;

export type LeadFilters = {
  search?: string;
  status?: LeadStatus;
};

export type PositionAssignment = { id: number; position: number };

/** How many leads there are in total and in each status. Every status is present, even at 0. */
export type LeadStats = {
  total: number;
  byStatus: Record<LeadStatus, number>;
};

/** Shapes of the request data after validation (see lead.schema.ts). */
export type CreateLeadInput = CreateLeadSchema;
export type UpdateLeadInput = UpdateLeadSchema;
export type ListLeadsQuery = ListLeadsQuerySchema;
export type LeadStatsQuery = LeadStatsQuerySchema;
export type ReorderLeadsInput = ReorderLeadsSchema;
