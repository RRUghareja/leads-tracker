export type Note = {
  id: number;
  leadId: number;
  content: string;
  createdAt: string;
};

/** Result of loading a lead's notes from a client component. */
export type NotesResult = { ok: true; notes: Note[] } | { ok: false; message: string };
