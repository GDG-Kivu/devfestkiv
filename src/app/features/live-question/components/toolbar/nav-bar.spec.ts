import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { NavBar } from './nav-bar';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { RoleService } from '../../../../core/auth/services/role.service';
import { EventConfigService } from '../../../event/services/event-config.service';

describe('NavBar', () => {
  let component: NavBar;
  let fixture: ComponentFixture<NavBar>;
  let authMock: any;
  let roleMock: any;

  beforeEach(async () => {
    authMock = {
      user: signal(null),
      signInWithGoogle: jasmine.createSpy('signInWithGoogle'),
      signOut: jasmine.createSpy('signOut').and.resolveTo(),
    };
    roleMock = {
      isAdmin: signal(false),
      ensureProfile: jasmine.createSpy('ensureProfile').and.resolveTo(null),
    };

    await TestBed.configureTestingModule({
      imports: [NavBar],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authMock },
        { provide: RoleService, useValue: roleMock },
        {
          provide: EventConfigService,
          useValue: {
            date: { display: { month: 'Octobre', year: 2025 } },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NavBar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should compute initials properly', () => {
    expect(component.getInitials('John Doe')).toBe('JD');
    expect(component.getInitials('Admin')).toBe('AD');
    expect(component.getInitials(null)).toBe('U');
  });

  it('should toggle and close user menu', () => {
    const fakeEvent = { stopPropagation: jasmine.createSpy('stopPropagation') } as any;
    component.toggleUserMenu(fakeEvent);
    expect(component.isUserMenuOpen()).toBeTrue();
    expect(fakeEvent.stopPropagation).toHaveBeenCalled();

    component.closeUserMenu();
    expect(component.isUserMenuOpen()).toBeFalse();
  });
});
