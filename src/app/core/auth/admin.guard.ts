import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { RoleService } from './role.service';

export const adminGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const roles = inject(RoleService);
  const router = inject(Router);
  const user = await auth.ensureAuthenticated();
  return (await roles.isCurrentUserAdmin(user)) ? true : router.createUrlTree(['/live_q']);
};
