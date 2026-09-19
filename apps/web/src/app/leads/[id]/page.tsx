import type { Metadata } from 'next';
import Link from 'next/link';
import { CloneLeadButton } from '@/components/CloneLeadButton';
import { DeleteLeadButton } from '@/components/DeleteLeadButton';
import { NoteForm } from '@/components/NoteForm';
import { NotesList } from '@/components/NotesList';
import { StatusBadge } from '@/components/StatusBadge';
import { SubmitButton } from '@/components/SubmitButton';
import { FORM_FIELDS, ROUTES } from '@/constants/constants';
import { LEAD_STATUS_VALUES } from '@/constants/enums';
import { MESSAGES } from '@/constants/messages';
import { capitalize, formatDateTime } from '@/lib/common';
import { leadsApi, requireLead } from '@/lib/leads-api';
import { updateStatusAction } from '../actions';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lead = await requireLead((await params).id);
  return { title: lead.name };
}

export default async function LeadDetailPage({ params }: Props) {
  const lead = await requireLead((await params).id);
  const notes = await leadsApi.listNotes(lead.id);

  return (
    <>
      <Link href={ROUTES.LEADS} className="back-link">
        {MESSAGES.DETAIL.BACK}
      </Link>

      <div className="page-header">
        <div className="page-header__title">
          <h1>{lead.name}</h1>
          <StatusBadge status={lead.status} />
        </div>
        <div className="page-header__actions">
          <Link href={ROUTES.editLead(lead.id)} className="btn btn--ghost">
            {MESSAGES.DETAIL.EDIT}
          </Link>
          <CloneLeadButton id={lead.id} />
          <DeleteLeadButton id={lead.id} name={lead.name} />
        </div>
      </div>

      <div className="detail-grid">
        <section className="card" aria-labelledby="details-heading">
          <h2 id="details-heading">{MESSAGES.DETAIL.DETAILS_HEADING}</h2>
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

          {/* key remounts the form when the status changes, so the select never shows a stale value */}
          <form
            key={lead.status}
            action={updateStatusAction.bind(null, lead.id)}
            className="status-form"
          >
            <label htmlFor={FORM_FIELDS.STATUS}>{MESSAGES.FORM.STATUS}</label>
            <select id={FORM_FIELDS.STATUS} name={FORM_FIELDS.STATUS} defaultValue={lead.status}>
              {LEAD_STATUS_VALUES.map((status) => (
                <option key={status} value={status}>
                  {capitalize(status)}
                </option>
              ))}
            </select>
            <SubmitButton className="btn btn--ghost" pendingText={MESSAGES.DETAIL.UPDATING}>
              {MESSAGES.DETAIL.UPDATE_STATUS}
            </SubmitButton>
          </form>
        </section>

        <section className="card" aria-labelledby="notes-heading">
          <h2 id="notes-heading">{MESSAGES.NOTES.heading(notes.length)}</h2>

          <NoteForm leadId={lead.id} />

          {notes.length === 0 ? (
            <p className="muted notes__empty">{MESSAGES.NOTES.EMPTY}</p>
          ) : (
            <NotesList notes={notes} />
          )}
        </section>
      </div>
    </>
  );
}
