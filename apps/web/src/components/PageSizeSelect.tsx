'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useTransition, type KeyboardEvent } from 'react';
import {
  MAX_PAGE_SIZE,
  MIN_PAGE_SIZE,
  PAGE_SIZE_DEBOUNCE_MS,
  PAGE_SIZE_OPTIONS,
} from '@/constants/constants';
import { MESSAGES } from '@/constants/messages';
import { buildLeadsHref, clamp, type LeadsFilters } from '@/lib/common';

type Props = { limit: number; filters: LeadsFilters };

const isPreset = (size: number) => (PAGE_SIZE_OPTIONS as readonly number[]).includes(size);

/**
 * "Rows per page": pick a preset, or type any number from MIN to MAX. Keeps the current search and
 * status, and returns to page 1 (a page number from the old size could be past the end).
 */
export function PageSizeSelect({ limit, filters }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // The box shows the size only when it is a custom one; presets live in the dropdown.
  const customFromUrl = isPreset(limit) ? '' : String(limit);
  const [custom, setCustom] = useState(customFromUrl);

  // Follow the URL (back button, dropdown) unless the user is typing in the box right now.
  useEffect(() => {
    if (document.activeElement !== inputRef.current) setCustom(customFromUrl);
  }, [customFromUrl]);
  useEffect(() => () => clearTimeout(timer.current), []);

  // Presets plus the current custom size, in order, so the dropdown always shows what is active.
  const options = [...new Set([...PAGE_SIZE_OPTIONS, limit])].sort((a, b) => a - b);

  // The size we last navigated to, so Enter followed by blur does not apply the same size twice.
  const requested = useRef(limit);
  useEffect(() => {
    requested.current = limit;
  }, [limit]);

  function go(size: number) {
    clearTimeout(timer.current);
    if (size === requested.current) return;
    requested.current = size;

    const href = buildLeadsHref({ ...filters, limit: size });
    startTransition(() => router.replace(href, { scroll: false }));
  }

  /** Applies what was typed. Too large is capped; unusable input puts the previous value back. */
  function commit(raw: string) {
    clearTimeout(timer.current);

    const typed = Number.parseInt(raw, 10);
    if (!Number.isInteger(typed) || typed < MIN_PAGE_SIZE) {
      setCustom(customFromUrl);
      return;
    }

    const size = clamp(typed, MIN_PAGE_SIZE, MAX_PAGE_SIZE);
    setCustom(String(size));
    go(size);
  }

  function onCustomChange(value: string) {
    setCustom(value);
    clearTimeout(timer.current);
    if (value.trim() !== '') timer.current = setTimeout(() => commit(value), PAGE_SIZE_DEBOUNCE_MS);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault();
      commit(custom);
    }
  }

  return (
    <div className="page-size" aria-busy={isPending}>
      <label className="page-size__field">
        <span className="muted">{MESSAGES.PAGINATION.ROWS_PER_PAGE}</span>
        <select
          value={limit}
          onChange={(event) => {
            setCustom('');
            go(Number(event.target.value));
          }}
        >
          {options.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </label>

      <input
        ref={inputRef}
        type="number"
        inputMode="numeric"
        className="page-size__custom"
        min={MIN_PAGE_SIZE}
        max={MAX_PAGE_SIZE}
        step={1}
        value={custom}
        onChange={(event) => onCustomChange(event.target.value)}
        onBlur={() => commit(custom)}
        onKeyDown={onKeyDown}
        placeholder={MESSAGES.PAGINATION.CUSTOM_PLACEHOLDER}
        aria-label={MESSAGES.PAGINATION.customLabel(MIN_PAGE_SIZE, MAX_PAGE_SIZE)}
      />
    </div>
  );
}
