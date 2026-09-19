'use client';

import { useActionState } from 'react';
import { loginAction } from '@/app/login/actions';
import { FORM_FIELDS } from '@/constants/constants';
import { MESSAGES } from '@/constants/messages';
import { SubmitButton } from './SubmitButton';

type Props = {
  /** Where to go after signing in. */
  next: string;
  /** Shown under the form when the built-in demo login is in use. */
  demoHint?: string;
};

/**
 * The sign-in popup: a card centred over a dimmed page. It is plain markup plus a server action, so it
 * shows instantly and also works without JavaScript.
 */
export function LoginForm({ next, demoHint }: Props) {
  const [state, formAction] = useActionState(loginAction, {});

  return (
    <div className="login">
      <div className="login__card" role="dialog" aria-modal="true" aria-labelledby="login-title">
        <div className="login__brand">
          <span className="brand__mark" aria-hidden="true" />
          {MESSAGES.APP.TITLE}
        </div>

        <h1 id="login-title">{MESSAGES.LOGIN.TITLE}</h1>
        <p className="muted login__subtitle">{MESSAGES.LOGIN.SUBTITLE}</p>

        <form action={formAction} className="login__form">
          <input type="hidden" name={FORM_FIELDS.NEXT} value={next} />

          {state.error && (
            <p className="alert alert--error" role="alert">
              {state.error}
            </p>
          )}

          <div className="field">
            <label htmlFor={FORM_FIELDS.USERNAME}>{MESSAGES.LOGIN.USERNAME}</label>
            <input
              id={FORM_FIELDS.USERNAME}
              name={FORM_FIELDS.USERNAME}
              type="text"
              autoComplete="username"
              autoFocus
              required
              defaultValue={state.username ?? ''}
            />
          </div>

          <div className="field">
            <label htmlFor={FORM_FIELDS.PASSWORD}>{MESSAGES.LOGIN.PASSWORD}</label>
            <input
              id={FORM_FIELDS.PASSWORD}
              name={FORM_FIELDS.PASSWORD}
              type="password"
              autoComplete="current-password"
              required
            />
          </div>

          <SubmitButton className="btn login__submit" pendingText={MESSAGES.LOGIN.SIGNING_IN}>
            {MESSAGES.LOGIN.SUBMIT}
          </SubmitButton>
        </form>

        {demoHint && <p className="login__hint">{demoHint}</p>}
      </div>
    </div>
  );
}
