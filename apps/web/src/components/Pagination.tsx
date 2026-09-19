import Link from 'next/link';
import { MESSAGES } from '@/constants/messages';
import { buildLeadsHref, type LeadsFilters } from '@/lib/common';
import type { PaginationMeta } from '@/types/common.types';
import { PageSizeSelect } from './PageSizeSelect';

type Props = {
  meta: PaginationMeta;
  /** Current search, status and page size, kept in every link so paging never loses them. */
  filters: LeadsFilters;
};

export function Pagination({ meta, filters }: Props) {
  const { page, limit, total, totalPages } = meta;
  const first = total === 0 ? 0 : (page - 1) * limit + 1;
  const last = Math.min(page * limit, total);

  return (
    <nav className="pagination" aria-label={MESSAGES.PAGINATION.LABEL}>
      <span className="muted">{MESSAGES.PAGINATION.showing(first, last, total)}</span>

      <div className="pagination__controls">
        <PageSizeSelect limit={limit} filters={filters} />

        {totalPages > 1 && (
          <span className="pagination__links">
            {page > 1 ? (
              <Link href={buildLeadsHref(filters, page - 1)} className="btn btn--ghost" rel="prev">
                {MESSAGES.PAGINATION.PREVIOUS}
              </Link>
            ) : (
              <span className="btn btn--ghost btn--disabled" aria-disabled="true">
                {MESSAGES.PAGINATION.PREVIOUS}
              </span>
            )}
            <span className="muted">{MESSAGES.PAGINATION.pageOf(page, totalPages)}</span>
            {page < totalPages ? (
              <Link href={buildLeadsHref(filters, page + 1)} className="btn btn--ghost" rel="next">
                {MESSAGES.PAGINATION.NEXT}
              </Link>
            ) : (
              <span className="btn btn--ghost btn--disabled" aria-disabled="true">
                {MESSAGES.PAGINATION.NEXT}
              </span>
            )}
          </span>
        )}
      </div>
    </nav>
  );
}
