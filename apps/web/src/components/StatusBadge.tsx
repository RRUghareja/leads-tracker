import type { LeadStatus } from '@/constants/enums';

export function StatusBadge({ status }: { status: LeadStatus }) {
  return <span className={`badge badge--${status}`}>{status}</span>;
}
