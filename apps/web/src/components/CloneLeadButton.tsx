import { cloneLeadAction } from '@/app/leads/actions';
import { MESSAGES } from '@/constants/messages';
import { CopyIcon } from './icons';
import { SubmitButton } from './SubmitButton';

type Props = {
  id: number;
  /** The lead's name, used for the icon button's tooltip and screen-reader label. */
  name?: string;
  /** Show just the icon (with a tooltip) instead of the word "Clone". */
  iconOnly?: boolean;
  className?: string;
};

export function CloneLeadButton({ id, name = '', iconOnly = false, className }: Props) {
  return (
    <form action={cloneLeadAction.bind(null, id)}>
      {iconOnly ? (
        <SubmitButton
          className={className ?? 'btn btn--ghost btn--icon'}
          label={MESSAGES.ACTIONS.cloneLabel(name)}
        >
          <CopyIcon />
        </SubmitButton>
      ) : (
        <SubmitButton
          className={className ?? 'btn btn--ghost'}
          pendingText={MESSAGES.ACTIONS.CLONING}
        >
          {MESSAGES.ACTIONS.CLONE}
        </SubmitButton>
      )}
    </form>
  );
}
