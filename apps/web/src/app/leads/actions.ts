'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { FORM_FIELDS, ROUTES } from '@/constants/constants';
import { LEAD_STATUS_VALUES, type LeadStatus } from '@/constants/enums';
import { MESSAGES } from '@/constants/messages';
import { ApiError } from '@/lib/api-error';
import { textOf } from '@/lib/common';
import { leadsApi } from '@/lib/leads-api';
import type { ActionResult, FormState } from '@/types/common.types';
import type { Lead, LeadInput } from '@/types/lead.types';
import type { NotesResult } from '@/types/note.types';

function readLeadForm(formData: FormData) {
  const values = {
    [FORM_FIELDS.NAME]: textOf(formData, FORM_FIELDS.NAME),
    [FORM_FIELDS.EMAIL]: textOf(formData, FORM_FIELDS.EMAIL),
    [FORM_FIELDS.PHONE]: textOf(formData, FORM_FIELDS.PHONE),
    [FORM_FIELDS.STATUS]: textOf(formData, FORM_FIELDS.STATUS),
  };

  const status = values[FORM_FIELDS.STATUS] as LeadStatus;

  const input: LeadInput = {
    name: values[FORM_FIELDS.NAME],
    email: values[FORM_FIELDS.EMAIL],
    phone: values[FORM_FIELDS.PHONE],
    status: LEAD_STATUS_VALUES.includes(status) ? status : undefined,
  };

  return { values, input };
}

/** Turns an API failure into something a form can display. Unknown errors keep bubbling up. */
function toFormState(error: unknown, values: Record<string, string>): FormState {
  if (!(error instanceof ApiError)) throw error;

  const fieldErrors = { ...error.fieldErrors };
  if (error.isConflict) fieldErrors[FORM_FIELDS.EMAIL] = error.message;

  return {
    message: error.isValidation ? MESSAGES.FORM.FIX_FIELDS : error.message,
    fieldErrors,
    values,
  };
}

/** Refreshes every cached page under /leads (list, detail and edit). */
const refreshLeads = () => revalidatePath(ROUTES.LEADS, 'layout');

export async function createLeadAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { values, input } = readLeadForm(formData);

  let lead: Lead;
  try {
    lead = await leadsApi.create(input);
  } catch (error) {
    return toFormState(error, values);
  }

  refreshLeads();
  redirect(ROUTES.lead(lead.id)); // redirect() throws, so it must stay outside the try block
}

export async function updateLeadAction(
  id: number,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { values, input } = readLeadForm(formData);

  try {
    await leadsApi.update(id, input);
  } catch (error) {
    return toFormState(error, values);
  }

  refreshLeads();
  redirect(ROUTES.lead(id));
}

export async function updateStatusAction(id: number, formData: FormData): Promise<void> {
  const status = textOf(formData, FORM_FIELDS.STATUS) as LeadStatus;

  await leadsApi.update(id, { status });
  refreshLeads();
}

/**
 * From the detail page the lead no longer exists, so we go back to the list. From the list itself
 * (`redirectAfter = false`) we stay put, keeping the user's search, filters and page size.
 */
export async function deleteLeadAction(id: number, redirectAfter: boolean): Promise<void> {
  await leadsApi.remove(id);

  refreshLeads();
  if (redirectAfter) redirect(ROUTES.LEADS);
}

/** Creates a copy and opens it for editing, since the copy needs its own email and name. */
export async function cloneLeadAction(id: number): Promise<void> {
  const copy = await leadsApi.clone(id);

  refreshLeads();
  redirect(ROUTES.editLead(copy.id));
}

/**
 * Loads a lead's notes for the Overview popup. The browser never talks to the API itself, so the
 * popup asks the Next.js server, which asks the API.
 */
export async function getLeadNotesAction(leadId: number): Promise<NotesResult> {
  try {
    return { ok: true, notes: await leadsApi.listNotes(leadId) };
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    return { ok: false, message: error.message };
  }
}

/** Saves the order after a drag and drop. `ids` are the visible leads, top to bottom. */
export async function reorderLeadsAction(ids: number[]): Promise<ActionResult> {
  try {
    await leadsApi.reorder(ids);
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    return { ok: false, message: error.message };
  }

  refreshLeads();
  return { ok: true };
}

export async function addNoteAction(
  leadId: number,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const content = textOf(formData, FORM_FIELDS.CONTENT);

  try {
    await leadsApi.addNote(leadId, content);
  } catch (error) {
    return toFormState(error, { [FORM_FIELDS.CONTENT]: content });
  }

  revalidatePath(ROUTES.lead(leadId));
  return {};
}
