import { logoutAction } from '@/app/login/actions';
import { MESSAGES } from '@/constants/messages';
import { SubmitButton } from './SubmitButton';

export function SignOutButton() {
  return (
    <form action={logoutAction}>
      <SubmitButton className="btn btn--ghost btn--sm" pendingText={MESSAGES.LOGIN.SIGNING_OUT}>
        {MESSAGES.LOGIN.SIGN_OUT}
      </SubmitButton>
    </form>
  );
}
