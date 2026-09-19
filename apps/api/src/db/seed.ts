import { loadConfig } from '../config/env';
import { LeadStatus } from '../constants/enums';
import { MESSAGES } from '../constants/messages';
import { LeadRepository } from '../modules/leads/lead.repository';
import { LeadService } from '../modules/leads/lead.service';
import type { NewLead } from '../modules/leads/lead.types';
import { NoteRepository } from '../modules/notes/note.repository';
import { NoteService } from '../modules/notes/note.service';
import { logger } from '../utils/logger';
import { createDatabase } from './connection';
import { migrate } from './migrate';

type SeedLead = NewLead & { notes: string[] };

const SEED_LEADS: SeedLead[] = [
  {
    name: 'Asha Patel',
    email: 'asha.patel@acme.example',
    phone: '+91 98765 43210',
    status: LeadStatus.NEW,
    notes: [],
  },
  {
    name: 'Ravi Kumar',
    email: 'ravi.kumar@globex.example',
    phone: '+91 91234 56789',
    status: LeadStatus.CONTACTED,
    notes: ['Intro call booked for Monday.', 'Sent the pricing deck. Waiting for feedback.'],
  },
  {
    name: 'Meera Shah',
    email: 'meera.shah@initech.example',
    phone: null,
    status: LeadStatus.QUALIFIED,
    notes: ['Budget approved for Q4.', 'Wants a demo with the whole team.'],
  },
  {
    name: 'John Carter',
    email: 'john.carter@umbrella.example',
    phone: '+1 415 555 0134',
    status: LeadStatus.LOST,
    notes: ['Went with a competitor.'],
  },
  {
    name: 'Sara Ali',
    email: 'sara.ali@hooli.example',
    phone: '+44 20 7946 0958',
    status: LeadStatus.NEW,
    notes: [],
  },
  {
    name: 'Nikhil Verma',
    email: 'nikhil.verma@stark.example',
    phone: '+91 99887 76655',
    status: LeadStatus.CONTACTED,
    notes: ['Left a voicemail.'],
  },
];

const config = loadConfig();
const db = createDatabase(config.databasePath);
migrate(db);

const leads = new LeadService(new LeadRepository(db));
const notes = new NoteService(new NoteRepository(db), leads);

// Never touch a database that already has data.
if (leads.list({ page: 1, limit: 1 }).meta.total > 0) {
  logger.info(MESSAGES.LOG.SEED_SKIPPED);
} else {
  for (const { notes: leadNotes, ...input } of SEED_LEADS) {
    const lead = leads.create(input);
    // Oldest note first, so the newest ends up on top of the list.
    for (const content of leadNotes) notes.addToLead(lead.id, content);
  }

  logger.info(MESSAGES.LOG.seeded(SEED_LEADS.length));
}

db.close();
