import type { LeadService } from '../leads/lead.service';
import type { NoteRepository } from './note.repository';
import type { Note } from './note.types';

export class NoteService {
  constructor(
    private readonly notes: NoteRepository,
    private readonly leads: LeadService,
  ) {}

  listForLead(leadId: number): Note[] {
    this.leads.get(leadId); // 404 when the lead does not exist

    return this.notes.findByLeadId(leadId);
  }

  addToLead(leadId: number, content: string): Note {
    this.leads.get(leadId);

    return this.notes.insert(leadId, content);
  }
}
