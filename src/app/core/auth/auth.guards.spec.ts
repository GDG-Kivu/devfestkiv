import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, UrlTree } from '@angular/router';
import { AuthService } from './auth.service';
import { RoleService } from './role.service';
import { adminGuard } from './admin.guard';
import { authGuard } from './auth.guard';

describe('live question route guards', () => {
  let auth: jasmine.SpyObj<AuthService>;
  let roles: jasmine.SpyObj<RoleService>;
  let router: Router;

  beforeEach(() => {
    auth = jasmine.createSpyObj<AuthService>('AuthService', ['ensureAuthenticated']);
    roles = jasmine.createSpyObj<RoleService>('RoleService', ['isCurrentUserAdmin']);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: auth },
        { provide: RoleService, useValue: roles },
      ],
    });
    router = TestBed.inject(Router);
  });

  it('allows a visitor after anonymous authentication succeeds', async () => {
    auth.ensureAuthenticated.and.resolveTo({ uid: 'visitor-1' } as never);

    const result = await TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));

    expect(result).toBeTrue();
  });

  it('redirects to the public site when authentication fails', async () => {
    auth.ensureAuthenticated.and.rejectWith(new Error('Authentication unavailable'));

    const result = await TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));

    expect(router.serializeUrl(result as UrlTree)).toBe('/');
  });

  it('allows an authenticated administrator', async () => {
    const user = { uid: 'admin-1' } as never;
    auth.ensureAuthenticated.and.resolveTo(user);
    roles.isCurrentUserAdmin.and.resolveTo(true);

    const result = await TestBed.runInInjectionContext(() => adminGuard({} as never, {} as never));

    expect(result).toBeTrue();
  });

  it('redirects a non-admin to the live questions page', async () => {
    auth.ensureAuthenticated.and.resolveTo({ uid: 'visitor-1' } as never);
    roles.isCurrentUserAdmin.and.resolveTo(false);

    const result = await TestBed.runInInjectionContext(() => adminGuard({} as never, {} as never));

    expect(router.serializeUrl(result as UrlTree)).toBe('/live_q');
  });
});
