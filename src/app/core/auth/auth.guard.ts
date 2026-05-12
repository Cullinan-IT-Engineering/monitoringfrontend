import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isLoggedIn()) {
    router.navigateByUrl('/login');
    return false;
  }
  return true;
};

/** Only Admin may open user-management routes (sidebar hides the link for others). */
export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isLoggedIn()) {
    router.navigateByUrl('/login');
    return false;
  }
  return auth.ensureRoleLoaded().pipe(
    map(() => {
      if (!auth.isAdmin()) {
        router.navigateByUrl('/dashboard');
        return false;
      }
      return true;
    }),
    catchError((e: HttpErrorResponse) => {
      if (e.status === 401) {
        auth.logout();
        router.navigateByUrl('/login');
      } else {
        router.navigateByUrl('/dashboard');
      }
      return of(false);
    })
  );
};
