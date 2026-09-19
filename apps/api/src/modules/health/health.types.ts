import type { DatabaseState, HealthStatus } from '../../constants/enums';

export type HealthReport = {
  status: HealthStatus;
  database: DatabaseState;
  uptimeSeconds: number;
  timestamp: string;
};
