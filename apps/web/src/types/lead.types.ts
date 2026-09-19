import type { LeadStatus } from '@/constants/enums';

export type Lead = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  status: LeadStatus;
  /** Manual sort order. Lower comes first. */
  position: number;
  createdAt: string;
  /** When the lead's own fields last changed. Starts equal to createdAt. */
  updatedAt: string;
};

/** Body accepted by POST /api/leads and PATCH /api/leads/:id. */
export type LeadInput = {
  name?: string;
  email?: string;
  phone?: string | null;
  status?: LeadStatus;
};

/** Leads in total and per status. Every status is present, even at 0. */
export type LeadStats = {
  total: number;
  byStatus: Record<LeadStatus, number>;
};

export type ListLeadsParams = {
  search?: string;
  status?: LeadStatus;
  page?: number;
  limit?: number;
};
