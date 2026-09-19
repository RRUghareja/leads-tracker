import Link from 'next/link';
import { ROUTES } from '@/constants/constants';
import { MESSAGES } from '@/constants/messages';

export default function NotFound() {
  return (
    <section className="card">
      <h1>{MESSAGES.ERRORS.PAGE_NOT_FOUND_TITLE}</h1>
      <p className="muted">{MESSAGES.ERRORS.PAGE_NOT_FOUND_TEXT}</p>
      <Link href={ROUTES.LEADS} className="btn">
        {MESSAGES.ERRORS.BACK_TO_LEADS}
      </Link>
    </section>
  );
}
