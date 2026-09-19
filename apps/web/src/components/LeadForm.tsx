'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { FORM_FIELDS } from '@/constants/constants';
import { LEAD_STATUS_VALUES, LeadStatus } from '@/constants/enums';
import { MESSAGES } from '@/constants/messages';
import { capitalize } from '@/lib/common';
import type { FormState } from '@/types/common.types';
import type { Lead } from '@/types/lead.types';
import { SelectField, TextField } from './fields';
import { SubmitButton } from './SubmitButton';

const STATUS_OPTIONS = LEAD_STATUS_VALUES.map((status) => ({
  value: status,
  label: capitalize(status),
}));

type FormField = 'name' | 'email' | 'phone' | 'status';

type Props = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  /** Present when editing; the form starts with this lead's values. */
  lead?: Lead;
  submitLabel: string;
  cancelHref: string;
};

/** Shared by the create and edit pages. Server-side validation errors appear under each field. */
export function LeadForm({ action, lead, submitLabel, cancelHref }: Props) {
  const [state, formAction] = useActionState(action, {});
  const errors = state.fieldErrors ?? {};
  const initial = (field: FormField, fallback = '') =>
    state.values?.[field] ?? lead?.[field] ?? fallback;

  return (
    <form action={formAction} noValidate className="card form">
      {state.message && (
        <p className="alert alert--error" role="alert">
          {state.message}
        </p>
      )}

      <TextField
        name={FORM_FIELDS.NAME}
        label={MESSAGES.FORM.NAME}
        defaultValue={initial(FORM_FIELDS.NAME)}
        error={errors[FORM_FIELDS.NAME]}
        autoComplete="off"
      />
      <TextField
        name={FORM_FIELDS.EMAIL}
        label={MESSAGES.FORM.EMAIL}
        type="email"
        defaultValue={initial(FORM_FIELDS.EMAIL)}
        error={errors[FORM_FIELDS.EMAIL]}
        autoComplete="off"
      />
      <TextField
        name={FORM_FIELDS.PHONE}
        label={MESSAGES.FORM.PHONE}
        type="tel"
        defaultValue={initial(FORM_FIELDS.PHONE)}
        error={errors[FORM_FIELDS.PHONE]}
        autoComplete="off"
      />
      <SelectField
        name={FORM_FIELDS.STATUS}
        label={MESSAGES.FORM.STATUS}
        options={STATUS_OPTIONS}
        defaultValue={initial(FORM_FIELDS.STATUS, LeadStatus.NEW)}
        error={errors[FORM_FIELDS.STATUS]}
      />

      <div className="form__actions">
        <SubmitButton>{submitLabel}</SubmitButton>
        <Link href={cancelHref} className="btn btn--ghost">
          {MESSAGES.FORM.CANCEL}
        </Link>
      </div>
    </form>
  );
}
