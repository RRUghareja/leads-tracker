import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { LeadsTable } from '@/components/LeadsTable';
import { LeadsToolbar } from '@/components/LeadsToolbar';
import { Pagination } from '@/components/Pagination';
import { StatusSummary } from '@/components/StatusSummary';
import { QUERY_PARAMS, ROUTES } from '@/constants/constants';
import { LEAD_STATUS_VALUES } from '@/constants/enums';
import { MESSAGES } from '@/constants/messages';
import { ApiError } from '@/lib/api-error';
import { buildLeadsHref, firstValue, parsePageSize, parsePositiveInt } from '@/lib/common';
import { leadsApi } from '@/lib/leads-api';

export const metadata: Metadata = { title: MESSAGES.LEADS.TITLE };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** URLs are user input: anything the API would reject is quietly ignored instead. */
function parseFilters(raw: Awaited<SearchParams>) {
  const search = firstValue(raw[QUERY_PARAMS.SEARCH])?.trim() || undefined;
  const status = LEAD_STATUS_VALUES.find((s) => s === firstValue(raw[QUERY_PARAMS.STATUS]));
  const page = parsePositiveInt(firstValue(raw[QUERY_PARAMS.PAGE]), 1);
  const limit = parsePageSize(firstValue(raw[QUERY_PARAMS.LIMIT]));

  return { search, status, page, limit };
}

async function loadLeads(filters: ReturnType<typeof parseFilters>) {
  try {
    return { result: await leadsApi.list(filters) };
  } catch (error) {
    if (error instanceof ApiError) return { error: error.message };
    throw error;
  }
}

/** The boxes are a nicety: if their numbers cannot be loaded, the list itself should still work. */
async function loadStats(search?: string) {
  try {
    return await leadsApi.stats(search);
  } catch (error) {
    if (error instanceof ApiError) return null;
    throw error;
  }
}

export default async function LeadsPage({ searchParams }: { searchParams: SearchParams }) {
  const filters = parseFilters(await searchParams);
  const { search, status, limit } = filters;

  // Both requests are independent, so they run at the same time.
  const [{ result, error }, stats] = await Promise.all([loadLeads(filters), loadStats(search)]);

  if (error || !result) {
    return (
      <section className="card" role="alert">
        <h1>{MESSAGES.LEADS.TITLE}</h1>
        <p className="alert alert--error">{error}</p>
      </section>
    );
  }

  // A stale link to a page that no longer exists (e.g. after deleting leads): jump to the last one.
  if (result.data.length === 0 && result.meta.total > 0 && filters.page > result.meta.totalPages) {
    redirect(buildLeadsHref({ search, status, limit }, result.meta.totalPages));
  }

  const isFiltered = Boolean(search || status);

  return (
    <>
      <div className="page-header">
        <div>
          <h1>{MESSAGES.LEADS.TITLE}</h1>
          <p className="muted">{MESSAGES.LEADS.count(result.meta.total, isFiltered)}</p>
        </div>
        <Link href={ROUTES.NEW_LEAD} className="btn">
          {MESSAGES.APP.NAV_NEW_LEAD}
        </Link>
      </div>

      {stats && <StatusSummary stats={stats} activeStatus={status} search={search} limit={limit} />}

      <LeadsToolbar search={search ?? ''} status={status ?? ''} limit={limit} />

      {result.data.length === 0 ? (
        <EmptyState isFiltered={isFiltered} />
      ) : (
        <LeadsTable leads={result.data} />
      )}

      {result.meta.total > 0 && (
        <Pagination meta={result.meta} filters={{ search, status, limit }} />
      )}
    </>
  );
}

function EmptyState({ isFiltered }: { isFiltered: boolean }) {
  const text = MESSAGES.LEADS;

  return (
    <div className="card empty">
      <h2>{isFiltered ? text.EMPTY_FILTERED_TITLE : text.EMPTY_TITLE}</h2>
      <p className="muted">{isFiltered ? text.EMPTY_FILTERED_HINT : text.EMPTY_HINT}</p>
      {!isFiltered && (
        <Link href={ROUTES.NEW_LEAD} className="btn">
          {text.ADD_FIRST}
        </Link>
      )}
    </div>
  );
}
