import type { Request, Response } from 'express';
import { API_ROUTES } from '../../constants/constants';
import { HttpStatus } from '../../constants/enums';
import { MESSAGES } from '../../constants/messages';
import { idOf } from '../../utils/common';
import { sendSuccess } from '../../utils/response';
import type { LeadService } from './lead.service';
import type {
  CreateLeadInput,
  LeadStatsQuery,
  ListLeadsQuery,
  ReorderLeadsInput,
  UpdateLeadInput,
} from './lead.types';

/**
 * Thin HTTP layer: read the already-validated request, call the service, choose the status code.
 * `validate()` has run by now, so params/query/body have their parsed types (see the casts).
 */
export class LeadController {
  constructor(private readonly service: LeadService) {}

  list = (req: Request, res: Response): void => {
    const { data, meta } = this.service.list(req.query as unknown as ListLeadsQuery);

    sendSuccess(res, { message: MESSAGES.SUCCESS.LEADS_FETCHED, data, meta });
  };

  stats = (req: Request, res: Response): void => {
    const stats = this.service.stats(req.query as unknown as LeadStatsQuery);

    sendSuccess(res, { message: MESSAGES.SUCCESS.LEAD_STATS, data: stats });
  };

  get = (req: Request, res: Response): void => {
    sendSuccess(res, { message: MESSAGES.SUCCESS.LEAD_FETCHED, data: this.service.get(idOf(req)) });
  };

  create = (req: Request, res: Response): void => {
    const lead = this.service.create(req.body as CreateLeadInput);

    res.location(`${API_ROUTES.LEADS}/${lead.id}`);
    sendSuccess(res, {
      status: HttpStatus.CREATED,
      message: MESSAGES.SUCCESS.LEAD_CREATED,
      data: lead,
    });
  };

  update = (req: Request, res: Response): void => {
    const lead = this.service.update(idOf(req), req.body as UpdateLeadInput);

    sendSuccess(res, { message: MESSAGES.SUCCESS.LEAD_UPDATED, data: lead });
  };

  remove = (req: Request, res: Response): void => {
    this.service.remove(idOf(req));

    sendSuccess(res, { message: MESSAGES.SUCCESS.LEAD_DELETED });
  };

  clone = (req: Request, res: Response): void => {
    const lead = this.service.clone(idOf(req));

    res.location(`${API_ROUTES.LEADS}/${lead.id}`);
    sendSuccess(res, {
      status: HttpStatus.CREATED,
      message: MESSAGES.SUCCESS.LEAD_CLONED,
      data: lead,
    });
  };

  reorder = (req: Request, res: Response): void => {
    const { ids } = req.body as ReorderLeadsInput;

    sendSuccess(res, {
      message: MESSAGES.SUCCESS.LEADS_REORDERED,
      data: this.service.reorder(ids),
    });
  };
}
