import Link from 'next/link';
import { LEAD_STATUS_VALUES, type LeadStatus } from '@/constants/enums';
import { MESSAGES } from '@/constants/messages';
import { buildLeadsHref, capitalize } from '@/lib/common';
import type { LeadStats } from '@/types/lead.types';

type Props = {
  stats: LeadStats;
  /** The status the list is currently filtered by, if any. */
  activeStatus?: LeadStatus;
  /** Kept in every link, so choosing a status does not throw away the search or page size. */
  search?: string;
  limit?: number;
};

/**
 * A row of boxes at the top of the list: how many leads there are overall and in each status.
 * Each box is a link that filters the list to that status; the current one is highlighted.
 */
export function StatusSummary({ stats, activeStatus, search, limit }: Props) {
  const cards: { status?: LeadStatus; label: string; count: number }[] = [
    { status: undefined, label: MESSAGES.SUMMARY.ALL, count: stats.total },
    ...LEAD_STATUS_VALUES.map((status) => ({
      status,
      label: capitalize(status),
      count: stats.byStatus[status],
    })),
  ];

  return (
    <nav className="summary" aria-label={MESSAGES.SUMMARY.LABEL}>
      {cards.map(({ status, label, count }) => {
        const isActive = status === activeStatus;

        return (
          <Link
            key={status ?? 'all'}
            href={buildLeadsHref({ search, status, limit })}
            className={`summary__card summary__card--${status ?? 'all'}${isActive ? ' is-active' : ''}`}
            aria-current={isActive ? 'true' : undefined}
            aria-label={MESSAGES.SUMMARY.cardLabel(label, count)}
            scroll={false}
          >
            <span className="summary__count">{count}</span>
            <span className="summary__label">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
