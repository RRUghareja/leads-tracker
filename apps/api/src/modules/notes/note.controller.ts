import type { Request, Response } from 'express';
import { HttpStatus } from '../../constants/enums';
import { MESSAGES } from '../../constants/messages';
import { idOf } from '../../utils/common';
import { sendSuccess } from '../../utils/response';
import type { NoteService } from './note.service';
import type { CreateNoteInput } from './note.types';

export class NoteController {
  constructor(private readonly service: NoteService) {}

  list = (req: Request, res: Response): void => {
    sendSuccess(res, {
      message: MESSAGES.SUCCESS.NOTES_FETCHED,
      data: this.service.listForLead(idOf(req)),
    });
  };

  create = (req: Request, res: Response): void => {
    const { content } = req.body as CreateNoteInput;

    sendSuccess(res, {
      status: HttpStatus.CREATED,
      message: MESSAGES.SUCCESS.NOTE_CREATED,
      data: this.service.addToLead(idOf(req), content),
    });
  };
}
