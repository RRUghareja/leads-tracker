'use server';

import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { FAILED_LOGIN_DELAY_MS, FORM_FIELDS, ROUTES, SESSION } from '@/constants/constants';
import { MESSAGES } from '@/constants/messages';
import { safeNextPath, textOf } from '@/lib/common';
import { readPortalAuth } from '@/lib/portal-auth';
import { createSessionToken, safeEqual } from '@/lib/session';
import type { LoginState } from '@/types/common.types';

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const auth = readPortalAuth();
  const next = safeNextPath(textOf(formData, FORM_FIELDS.NEXT));

  // Nothing to sign in to (login switched off): just go on.
  if (auth.mode !== 'on') redirect(next);

  const username = textOf(formData, FORM_FIELDS.USERNAME);
  const password = textOf(formData, FORM_FIELDS.PASSWORD);

  // Check both, so timing does not reveal which one was wrong.
  const userOk = safeEqual(username, auth.user);
  const passwordOk = safeEqual(password, auth.password);

  if (!userOk || !passwordOk) {
    await new Promise((resolve) => setTimeout(resolve, FAILED_LOGIN_DELAY_MS));
    return { error: MESSAGES.LOGIN.INVALID, username };
  }

  // The cookie is only marked Secure when the site is served over https, so plain http://localhost works.
  const secure = (await headers()).get('x-forwarded-proto') === 'https';

  (await cookies()).set(SESSION.COOKIE, await createSessionToken(auth.user, auth.password), {
    httpOnly: true, // not readable by scripts on the page
    sameSite: 'lax',
    secure,
    path: '/',
    maxAge: SESSION.MAX_AGE_SECONDS,
  });

  redirect(next); // redirect() throws, so it stays last
}

export async function logoutAction(): Promise<void> {
  (await cookies()).delete(SESSION.COOKIE);

  redirect(ROUTES.LOGIN);
}
