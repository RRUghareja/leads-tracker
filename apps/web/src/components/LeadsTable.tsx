'use client';

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Link from 'next/link';
import { useEffect, useState, useTransition } from 'react';
import { reorderLeadsAction } from '@/app/leads/actions';
import { ROUTES } from '@/constants/constants';
import { MESSAGES } from '@/constants/messages';
import { formatDate, formatDateTime } from '@/lib/common';
import type { Lead } from '@/types/lead.types';
import { CloneLeadButton } from './CloneLeadButton';
import { DeleteLeadButton } from './DeleteLeadButton';
import { EyeIcon, PencilIcon } from './icons';
import { LeadOverviewDialog, type OverviewRequest } from './LeadOverviewDialog';
import { StatusBadge } from './StatusBadge';

/** Six dots: the usual "grab here" symbol. */
function GripIcon() {
  return (
    <svg width="14" height="18" viewBox="0 0 14 18" fill="currentColor" aria-hidden="true">
      {[3, 9, 15].map((y) => (
        <g key={y}>
          <circle cx="4" cy={y} r="1.6" />
          <circle cx="10" cy={y} r="1.6" />
        </g>
      ))}
    </svg>
  );
}

function SortableRow({ lead, onOverview }: { lead: Lead; onOverview: (id: number) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id });

  return (
    <tr
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={isDragging ? 'row--dragging' : undefined}
    >
      <td className="cell-handle">
        <button
          type="button"
          ref={setActivatorNodeRef}
          className="drag-handle"
          aria-label={MESSAGES.LEADS.dragHandleLabel(lead.name)}
          {...attributes}
          {...listeners}
        >
          <GripIcon />
        </button>
      </td>
      <td className="cell-clip cell-clip--name" title={lead.name}>
        <Link href={ROUTES.lead(lead.id)} className="table__name">
          {lead.name}
        </Link>
      </td>
      <td className="cell-clip" title={lead.email}>
        {lead.email}
      </td>
      <td>{lead.phone ?? <span className="muted">{MESSAGES.LEADS.NO_VALUE}</span>}</td>
      <td>
        <StatusBadge status={lead.status} />
      </td>
      <td className="muted col-created">{formatDate(lead.createdAt)}</td>
      <td className="muted">
        <time dateTime={lead.updatedAt}>{formatDateTime(lead.updatedAt)}</time>
      </td>
      <td>
        <div className="row-actions">
          <button
            type="button"
            className="btn btn--ghost btn--icon"
            aria-label={MESSAGES.ACTIONS.overviewLabel(lead.name)}
            title={MESSAGES.ACTIONS.overviewLabel(lead.name)}
            onClick={() => onOverview(lead.id)}
          >
            <EyeIcon />
          </button>
          <Link
            href={ROUTES.editLead(lead.id)}
            className="btn btn--ghost btn--icon"
            aria-label={MESSAGES.ACTIONS.editLabel(lead.name)}
            title={MESSAGES.ACTIONS.editLabel(lead.name)}
          >
            <PencilIcon />
          </Link>
          <CloneLeadButton id={lead.id} name={lead.name} iconOnly />
          <DeleteLeadButton
            id={lead.id}
            name={lead.name}
            redirectAfter={false}
            iconOnly
            className="btn btn--danger btn--icon"
          />
        </div>
      </td>
    </tr>
  );
}

/**
 * The leads list. Rows can be reordered by dragging their handle (mouse, touch or keyboard). The
 * new order shows immediately and is saved in the background; if saving fails, the old order returns.
 */
export function LeadsTable({ leads }: { leads: Lead[] }) {
  const [items, setItems] = useState(leads);
  const [overview, setOverview] = useState<OverviewRequest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, startSaving] = useTransition();

  // Show what the server sends whenever it sends something new (search, paging, a saved change).
  useEffect(() => setItems(leads), [leads]);

  const sensors = useSensors(
    // A few pixels of movement first, so clicking a button in the row is never mistaken for a drag.
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;

    const from = items.findIndex((lead) => lead.id === active.id);
    const to = items.findIndex((lead) => lead.id === over.id);
    if (from === -1 || to === -1) return;

    const previous = items;
    const reordered = arrayMove(items, from, to);

    setItems(reordered);
    setError(null);

    startSaving(async () => {
      const result = await reorderLeadsAction(reordered.map((lead) => lead.id));

      if (!result.ok) {
        setItems(previous);
        setError(`${MESSAGES.LEADS.REORDER_FAILED} (${result.message})`);
      }
    });
  }

  return (
    <>
      {error && (
        <p className="alert alert--error" role="alert">
          {error}
        </p>
      )}

      <div className={`card card--flush table-wrap${isSaving ? ' is-saving' : ''}`}>
        {/* A fixed id keeps the server and browser HTML identical (dnd-kit would otherwise number it). */}
        <DndContext
          id="leads-table"
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragEnd={onDragEnd}
        >
          <table className="table">
            <thead>
              <tr>
                <th className="cell-handle" aria-hidden="true" />
                <th>{MESSAGES.LEADS.COLUMNS.NAME}</th>
                <th>{MESSAGES.LEADS.COLUMNS.EMAIL}</th>
                <th>{MESSAGES.LEADS.COLUMNS.PHONE}</th>
                <th>{MESSAGES.LEADS.COLUMNS.STATUS}</th>
                <th className="col-created">{MESSAGES.LEADS.COLUMNS.CREATED}</th>
                <th>{MESSAGES.LEADS.COLUMNS.UPDATED}</th>
                <th>{MESSAGES.LEADS.ACTIONS_HEADING}</th>
              </tr>
            </thead>
            <SortableContext
              items={items.map((lead) => lead.id)}
              strategy={verticalListSortingStrategy}
            >
              <tbody>
                {items.map((lead) => (
                  <SortableRow key={lead.id} lead={lead} onOverview={(id) => setOverview({ id })} />
                ))}
              </tbody>
            </SortableContext>
          </table>
        </DndContext>
      </div>

      <p className="muted drag-hint">{MESSAGES.LEADS.DRAG_HINT}</p>

      <LeadOverviewDialog request={overview} leads={items} onClose={() => setOverview(null)} />
    </>
  );
}
