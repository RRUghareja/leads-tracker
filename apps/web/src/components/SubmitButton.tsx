'use client';

import type { ReactNode } from 'react';
import { useFormStatus } from 'react-dom';
import { MESSAGES } from '@/constants/messages';

type Props = {
  children: ReactNode;
  /** Text shown while the action runs. Ignored for icon buttons, which keep their icon. */
  pendingText?: string;
  className?: string;
  /**
   * For icon-only buttons: the accessible name, also shown as a tooltip on hover.
   * Setting it keeps the icon visible while the action is running (the button just dims).
   */
  label?: string;
};

/** Disables itself while the surrounding form's server action is running (prevents double submits). */
export function SubmitButton({
  children,
  pendingText = MESSAGES.FORM.SAVING,
  className = 'btn',
  label,
}: Props) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className={className}
      disabled={pending}
      aria-disabled={pending}
      aria-label={label}
      title={label}
    >
      {pending && !label ? pendingText : children}
    </button>
  );
}
