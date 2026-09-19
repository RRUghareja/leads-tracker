import { formatDateTime } from '@/lib/common';
import type { Note } from '@/types/note.types';

/** Read-only list of notes, newest first (the order the API returns them in). */
export function NotesList({ notes }: { notes: Note[] }) {
  return (
    <ul className="notes">
      {notes.map((note) => (
        <li key={note.id} className="note">
          <p className="note__content">{note.content}</p>
          <time className="muted" dateTime={note.createdAt}>
            {formatDateTime(note.createdAt)}
          </time>
        </li>
      ))}
    </ul>
  );
}
