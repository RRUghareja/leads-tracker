'use client';

import { useActionState } from 'react';
import { addNoteAction } from '@/app/leads/actions';
import { FORM_FIELDS } from '@/constants/constants';
import { MESSAGES } from '@/constants/messages';
import { TextField } from './fields';
import { SubmitButton } from './SubmitButton';

export function NoteForm({ leadId }: { leadId: number }) {
  const [state, formAction] = useActionState(addNoteAction.bind(null, leadId), {});

  return (
    <form action={formAction} noValidate>
      <TextField
        name={FORM_FIELDS.CONTENT}
        label={MESSAGES.NOTES.ADD_LABEL}
        multiline
        placeholder={MESSAGES.NOTES.PLACEHOLDER}
        defaultValue={state.values?.[FORM_FIELDS.CONTENT] ?? ''}
        error={
          state.fieldErrors?.[FORM_FIELDS.CONTENT] ??
          (state.fieldErrors ? undefined : state.message)
        }
      />
      <SubmitButton pendingText={MESSAGES.NOTES.ADDING}>{MESSAGES.NOTES.ADD_BUTTON}</SubmitButton>
    </form>
  );
}
