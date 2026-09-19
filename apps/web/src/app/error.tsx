'use client';

import { MESSAGES } from '@/constants/messages';

/** Catches unexpected errors thrown while rendering any page below the layout. */
export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <section className="card" role="alert">
      <h1>{MESSAGES.ERRORS.GENERIC_TITLE}</h1>
      <p className="muted">{error.message || MESSAGES.ERRORS.GENERIC_FALLBACK}</p>
      <button type="button" className="btn" onClick={reset}>
        {MESSAGES.ERRORS.TRY_AGAIN}
      </button>
    </section>
  );
}
