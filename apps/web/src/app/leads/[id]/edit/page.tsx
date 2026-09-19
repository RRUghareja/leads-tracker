import type { Metadata } from 'next';
import { LeadForm } from '@/components/LeadForm';
import { ROUTES } from '@/constants/constants';
import { MESSAGES } from '@/constants/messages';
import { requireLead } from '@/lib/leads-api';
import { updateLeadAction } from '../../actions';

export const metadata: Metadata = { title: MESSAGES.DETAIL.EDIT };

export default async function EditLeadPage({ params }: { params: Promise<{ id: string }> }) {
  const lead = await requireLead((await params).id);

  return (
    <>
      <div className="page-header">
        <h1>{MESSAGES.LEADS.EDIT_TITLE(lead.name)}</h1>
      </div>
      <LeadForm
        action={updateLeadAction.bind(null, lead.id)}
        lead={lead}
        submitLabel={MESSAGES.FORM.SAVE}
        cancelHref={ROUTES.lead(lead.id)}
      />
    </>
  );
}
