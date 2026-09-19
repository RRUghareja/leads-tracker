'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useTransition, type FormEvent } from 'react';
import { QUERY_PARAMS, SEARCH_DEBOUNCE_MS } from '@/constants/constants';
import { LEAD_STATUS_VALUES } from '@/constants/enums';
import { MESSAGES } from '@/constants/messages';
import { buildLeadsHref, capitalize } from '@/lib/common';

type Props = { search: string; status: string; limit: number };

/**
 * Search box and status filter that update the list as you go: the status applies the moment it
 * changes, and typing is debounced so we do not hit the API on every keystroke. The state lives in
 * the URL, so filtered views can be bookmarked, shared and reached with the back button.
 */
export function LeadsToolbar({ search: urlSearch, status: urlStatus, limit }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(urlSearch);
  const [status, setStatus] = useState(urlStatus);
  const inputRef = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Follow the URL when it changes from outside (back button, links). Never overwrite what the
  // user is typing right now.
  useEffect(() => {
    if (document.activeElement !== inputRef.current) setSearch(urlSearch);
  }, [urlSearch]);
  useEffect(() => setStatus(urlStatus), [urlStatus]);
  useEffect(() => () => clearTimeout(timer.current), []);

  function apply(next: { search: string; status: string }) {
    clearTimeout(timer.current);

    // Changing a filter always returns to page 1.
    const href = buildLeadsHref({ search: next.search.trim(), status: next.status, limit });
    startTransition(() => router.replace(href, { scroll: false }));
  }

  function onSearchChange(value: string) {
    setSearch(value);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => apply({ search: value, status }), SEARCH_DEBOUNCE_MS);
  }

  function onStatusChange(value: string) {
    setStatus(value);
    apply({ search, status: value });
  }

  function onClear() {
    setSearch('');
    setStatus('');
    apply({ search: '', status: '' });
  }

  // Enter searches immediately. Without JavaScript the form still works as a plain GET.
  function onSubmit(event: FormEvent) {
    event.preventDefault();
    apply({ search, status });
  }

  const isFiltered = search.trim() !== '' || status !== '';

  return (
    <form
      method="get"
      action="/leads"
      className="toolbar"
      role="search"
      aria-busy={isPending}
      onSubmit={onSubmit}
    >
      <input
        ref={inputRef}
        type="search"
        name={QUERY_PARAMS.SEARCH}
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder={MESSAGES.LEADS.SEARCH_PLACEHOLDER}
        aria-label={MESSAGES.LEADS.SEARCH_LABEL}
        autoComplete="off"
      />
      <select
        name={QUERY_PARAMS.STATUS}
        value={status}
        onChange={(event) => onStatusChange(event.target.value)}
        aria-label={MESSAGES.LEADS.FILTER_LABEL}
      >
        <option value="">{MESSAGES.LEADS.ALL_STATUSES}</option>
        {LEAD_STATUS_VALUES.map((value) => (
          <option key={value} value={value}>
            {capitalize(value)}
          </option>
        ))}
      </select>
      {isFiltered && (
        <button type="button" className="btn btn--ghost" onClick={onClear}>
          {MESSAGES.LEADS.CLEAR}
        </button>
      )}
      {isPending && (
        <span className="toolbar__status muted" role="status">
          {MESSAGES.LEADS.UPDATING}
        </span>
      )}
    </form>
  );
}
