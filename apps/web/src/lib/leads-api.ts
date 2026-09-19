import 'server-only';
import { notFound } from 'next/navigation';
import { API_ENDPOINTS } from '@/constants/constants';
import { HttpMethod } from '@/constants/enums';
import type { Paginated } from '@/types/common.types';
import type { Lead, LeadInput, LeadStats, ListLeadsParams } from '@/types/lead.types';
import type { Note } from '@/types/note.types';
import { apiFetch, unwrap } from './api-client';
import { ApiError } from './api-error';
import { isNumericId } from './common';

/** One function per API endpoint, so pages and actions never build URLs themselves. */
export const leadsApi = {
  async list(params: ListLeadsParams): Promise<Paginated<Lead>> {
    const response = await apiFetch<Lead[]>(API_ENDPOINTS.LEADS, { query: params });
    const data = response.data ?? [];

    return {
      data,
      meta: response.meta ?? { page: 1, limit: data.length, total: data.length, totalPages: 1 },
    };
  },

  async get(id: number): Promise<Lead> {
    return unwrap(await apiFetch<Lead>(API_ENDPOINTS.lead(id)));
  },

  async create(input: LeadInput): Promise<Lead> {
    return unwrap(
      await apiFetch<Lead>(API_ENDPOINTS.LEADS, { method: HttpMethod.POST, body: input }),
    );
  },

  async update(id: number, input: LeadInput): Promise<Lead> {
    return unwrap(
      await apiFetch<Lead>(API_ENDPOINTS.lead(id), { method: HttpMethod.PATCH, body: input }),
    );
  },

  async clone(id: number): Promise<Lead> {
    return unwrap(await apiFetch<Lead>(API_ENDPOINTS.cloneLead(id), { method: HttpMethod.POST }));
  },

  /** Counts for the summary boxes, optionally limited to leads matching a search. */
  async stats(search?: string): Promise<LeadStats> {
    return unwrap(await apiFetch<LeadStats>(API_ENDPOINTS.LEAD_STATS, { query: { search } }));
  },

  /** `ids` is the new top-to-bottom order of the leads currently on screen. */
  async reorder(ids: number[]): Promise<void> {
    await apiFetch<Lead[]>(API_ENDPOINTS.REORDER_LEADS, {
      method: HttpMethod.PATCH,
      body: { ids },
    });
  },

  async remove(id: number): Promise<void> {
    await apiFetch<null>(API_ENDPOINTS.lead(id), { method: HttpMethod.DELETE });
  },

  async listNotes(id: number): Promise<Note[]> {
    return (await apiFetch<Note[]>(API_ENDPOINTS.leadNotes(id))).data ?? [];
  },

  async addNote(id: number, content: string): Promise<Note> {
    return unwrap(
      await apiFetch<Note>(API_ENDPOINTS.leadNotes(id), {
        method: HttpMethod.POST,
        body: { content },
      }),
    );
  },
};

/**
 * Loads the lead for a `/leads/[id]` URL segment, or renders the 404 page.
 * Anything that is not a plain number (e.g. /leads/abc) is a 404 too.
 */
export async function requireLead(idSegment: string): Promise<Lead> {
  if (!isNumericId(idSegment)) notFound();

  try {
    return await leadsApi.get(Number(idSegment));
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound) notFound();
    throw error;
  }
}
