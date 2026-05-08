import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { DashboardService } from '../../../services/dashboard.service';

export type IpPolicyRow = { ip: string; policy: 'whitelist' | 'blacklist' | null };

export const ipListResolver: ResolveFn<IpPolicyRow[]> = () => {
  const api = inject(DashboardService);
  return api.listDistinctIps().pipe(catchError(() => of([])));
};
