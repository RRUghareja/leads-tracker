'use client';

import { useEffect, useRef, useState } from 'react';
import { getLeadNotesAction } from '@/app/leads/actions';
import { MESSAGES } from '@/constants/messages';
import { formatDateTime } from '@/lib/common';
import type { Lead } from '@/types/lead.types';
import type { Note } from '@/types/note.types';
import { NotesList } from './NotesList';
import { StatusBadge } from './StatusBadge';

export type OverviewRequest = { id: number };

type Props = {
  /**
   * Which lead to show. Every click on Overview creates a new object, so asking for the same lead
   * twice in a row still re-opens the popup, even if it was closed with Esc.
   */
  request: OverviewRequest | null;
  leads: Lead[];
  onClose: () => void;
};

type NotesState =
  { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; notes: Note[] };

/**
 * Read-only popup with a lead's details and notes. Built on the native <dialog> element, so Esc
 * closes it, keyboard focus stays inside while it is open, and focus returns to the Overview button
 * afterwards.
 */
export function LeadOverviewDialog({ request, leads, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const lead = request ? (leads.find((item) => item.id === request.id) ?? null) : null;

  const [notes, setNotes] = useState<NotesState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  // Runs once per request (not on every render), so an unrelated re-render never re-opens the popup.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (request && lead && !dialog.open) dialog.showModal();
    if (!request && dialog.open) dialog.close();
  }, [request]);

  // Notes are fetched fresh on every open, so they are never out of date. `cancelled` drops the
  // answer if the popup was closed or switched to another lead while the request was in flight.
  useEffect(() => {
    if (!request) return;

    let cancelled = false;
    setNotes({ status: 'loading' });

    getLeadNotesAction(request.id)
      .then((result) => {
        if (cancelled) return;
        setNotes(
          result.ok
            ? { status: 'ready', notes: result.notes }
            : { status: 'error', message: result.message },
        );
      })
      .catch(() => {
        if (!cancelled) setNotes({ status: 'error', message: MESSAGES.OVERVIEW.NOTES_FAILED });
      });

    return () => {
      cancelled = true;
    };
  }, [request, attempt]);

  return (
    <dialog
      ref={dialogRef}
      className="dialog"
      aria-labelledby="overview-title"
      // Fires for Esc, the Close button and clicks on the dimmed background alike.
      // A late event from a popup that was already replaced must not close the new one.
      onClose={() => {
        if (dialogRef.current && !dialogRef.current.open) onClose();
      }}
      // The dialog itself has no padding, so a click whose target is the dialog is a backdrop click.
      onClick={(event) => {
        if (event.target === dialogRef.current) dialogRef.current?.close();
      }}
    >
      {lead && (
        <div className="dialog__body">
          <div className="dialog__header">
            <div className="dialog__title">
              <h2 id="overview-title">{lead.name}</h2>
              <StatusBadge status={lead.status} />
            </div>
            <button
              type="button"
              className="dialog__close"
              aria-label={MESSAGES.OVERVIEW.CLOSE}
              onClick={() => dialogRef.current?.close()}
            >
              ×
            </button>
          </div>

          <dl className="details">
            <dt>{MESSAGES.DETAIL.EMAIL}</dt>
            <dd>
              <a href={`mailto:${lead.email}`}>{lead.email}</a>
            </dd>
            <dt>{MESSAGES.DETAIL.PHONE}</dt>
            <dd>{lead.phone ?? <span className="muted">{MESSAGES.DETAIL.PHONE_EMPTY}</span>}</dd>
            <dt>{MESSAGES.DETAIL.CREATED}</dt>
            <dd>{formatDateTime(lead.createdAt)}</dd>
            <dt>{MESSAGES.DETAIL.UPDATED}</dt>
            <dd>{formatDateTime(lead.updatedAt)}</dd>
          </dl>

          <section className="dialog__notes" aria-labelledby="overview-notes-title">
            <h3 id="overview-notes-title">
              {notes.status === 'ready'
                ? MESSAGES.NOTES.heading(notes.notes.length)
                : MESSAGES.NOTES.TITLE}
            </h3>

            <div aria-live="polite">
              {notes.status === 'loading' && (
                <p className="muted">{MESSAGES.OVERVIEW.NOTES_LOADING}</p>
              )}

              {notes.status === 'error' && (
                <p className="alert alert--error" role="alert">
                  {notes.message}{' '}
                  <button
                    type="button"
                    className="link-button"
                    onClick={() => setAttempt((count) => count + 1)}
                  >
                    {MESSAGES.OVERVIEW.RETRY}
                  </button>
                </p>
              )}

              {notes.status === 'ready' &&
                (notes.notes.length === 0 ? (
                  <p className="muted">{MESSAGES.NOTES.NONE}</p>
                ) : (
                  <NotesList notes={notes.notes} />
                ))}
            </div>
          </section>

          <div className="dialog__footer">
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => dialogRef.current?.close()}
            >
              {MESSAGES.OVERVIEW.CLOSE}
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}
