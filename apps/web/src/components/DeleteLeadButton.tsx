'use client';

import { deleteLeadAction } from '@/app/leads/actions';
import { MESSAGES } from '@/constants/messages';
import { TrashIcon } from './icons';
import { SubmitButton } from './SubmitButton';

type Props = {
  id: number;
  name: string;
  /** Go back to the list afterwards. Turn off when already on the list, so filters are kept. */
  redirectAfter?: boolean;
  /** Show just the icon (with a tooltip) instead of the word "Delete". */
  iconOnly?: boolean;
  className?: string;
};

export function DeleteLeadButton({
  id,
  name,
  redirectAfter = true,
  iconOnly = false,
  className = 'btn btn--danger',
}: Props) {
  return (
    <form
      action={deleteLeadAction.bind(null, id, redirectAfter)}
      onSubmit={(event) => {
        // Cancelling the confirm dialog stops the server action from running.
        if (!window.confirm(MESSAGES.DETAIL.confirmDelete(name))) event.preventDefault();
      }}
    >
      {iconOnly ? (
        <SubmitButton className={className} label={MESSAGES.ACTIONS.deleteLabel(name)}>
          <TrashIcon />
        </SubmitButton>
      ) : (
        <SubmitButton className={className} pendingText={MESSAGES.ACTIONS.DELETING}>
          {MESSAGES.ACTIONS.DELETE}
        </SubmitButton>
      )}
    </form>
  );
}
