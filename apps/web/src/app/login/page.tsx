import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { LoginForm } from '@/components/LoginForm';
import { QUERY_PARAMS } from '@/constants/constants';
import { MESSAGES } from '@/constants/messages';
import { firstValue, safeNextPath } from '@/lib/common';
import { readPortalAuth } from '@/lib/portal-auth';
import { isSignedIn } from '@/lib/session-server';

export const metadata: Metadata = { title: MESSAGES.LOGIN.TITLE };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const auth = readPortalAuth();
  const next = safeNextPath(firstValue((await searchParams)[QUERY_PARAMS.NEXT]));

  // Login switched off, or already signed in: there is nothing to do here.
  if (auth.mode !== 'on' || (await isSignedIn(auth))) redirect(next);

  return (
    <LoginForm
      next={next}
      demoHint={auth.usesDemoLogin ? MESSAGES.LOGIN.demoHint(auth.user, auth.password) : undefined}
    />
  );
}
