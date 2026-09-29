import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { RoleService } from './role.service';

export const presenterGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const roles = inject(RoleService);
  const router = inject(Router);
  const user = await auth.ensureAuthenticated();
  if (!user) return router.createUrlTree(['/live_q']);
  return (await roles.isCurrentUserPresenter(user)) ? true : router.createUrlTree(['/live_q']);
};
