import { Router } from 'express';
import { ROUTE_PATHS } from '../../constants/constants';
import { DatabaseState, ErrorCode, HealthStatus, HttpStatus } from '../../constants/enums';
import { MESSAGES } from '../../constants/messages';
import type { Db } from '../../db/connection';
import { sendError, sendSuccess } from '../../utils/response';
import type { HealthReport } from './health.types';

function checkDatabase(db: Db): DatabaseState {
  try {
    db.get('SELECT 1');
    return DatabaseState.UP;
  } catch {
    return DatabaseState.DOWN;
  }
}

/** Liveness + database check. Deliberately public so uptime probes work without credentials. */
export function createHealthRouter(db: Db): Router {
  const router = Router();

  router.get(ROUTE_PATHS.ROOT, (_req, res) => {
    const database = checkDatabase(db);
    const healthy = database === DatabaseState.UP;

    const report: HealthReport = {
      status: healthy ? HealthStatus.OK : HealthStatus.DEGRADED,
      database,
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    };

    if (healthy) {
      sendSuccess(res, { message: MESSAGES.SUCCESS.HEALTH_OK, data: report });
      return;
    }

    sendError(res, {
      status: HttpStatus.SERVICE_UNAVAILABLE,
      code: ErrorCode.SERVICE_UNAVAILABLE,
      message: MESSAGES.ERROR.DATABASE_DOWN,
      details: report,
    });
  });

  return router;
}
