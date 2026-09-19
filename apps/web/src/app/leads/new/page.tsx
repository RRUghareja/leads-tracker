import type { Metadata } from 'next';
import { LeadForm } from '@/components/LeadForm';
import { ROUTES } from '@/constants/constants';
import { MESSAGES } from '@/constants/messages';
import { createLeadAction } from '../actions';

export const metadata: Metadata = { title: MESSAGES.LEADS.NEW_TITLE };

export default function NewLeadPage() {
  return (
    <>
      <div className="page-header">
        <h1>{MESSAGES.LEADS.NEW_TITLE}</h1>
      </div>
      <LeadForm
        action={createLeadAction}
        submitLabel={MESSAGES.FORM.CREATE}
        cancelHref={ROUTES.LEADS}
      />
    </>
  );
}
