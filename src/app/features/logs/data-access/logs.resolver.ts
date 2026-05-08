import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { DashboardService } from '../../../services/dashboard.service';

export type LogsResolverData = {
  logs: Array<{ ts: string; ip: string; method: string; path: string; attackType: string; riskScore: number; blocked: boolean }>;
  attackTypes: string[];
};

export const logsResolver: ResolveFn<LogsResolverData> = () => {
  const api = inject(DashboardService);
  return forkJoin({
    logs: api.logs().pipe(catchError(() => of([]))),
    attackTypes: api.allAttackTypes().pipe(catchError(() => of([]))),
  });
};
