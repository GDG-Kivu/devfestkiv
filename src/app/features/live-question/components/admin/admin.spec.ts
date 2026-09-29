import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import AdminComponent from './admin';
import { AuthService } from '../../../../core/auth/auth.service';
import { RoleService } from '../../../../core/auth/role.service';
import { FirestoreService } from '../../../../core/firestore/firestore.service';

describe('AdminComponent', () => {
  let component: AdminComponent;
  let fixture: ComponentFixture<AdminComponent>;
  let fsMock: any;
  let authMock: any;
  let roleMock: any;

  beforeEach(async () => {
    fsMock = {
      getSessions: jasmine.createSpy('getSessions').and.returnValue(of([])),
    };
    authMock = {
      user: signal({
        uid: 'admin-uid',
        email: 'admin@devfestkivu.org',
        displayName: 'Festival Admin',
      }),
      signOut: jasmine.createSpy('signOut').and.resolveTo(),
    };
    roleMock = {
      isAdmin: signal(true),
      transferAdminRole: jasmine.createSpy('transferAdminRole').and.resolveTo(),
    };

    await TestBed.configureTestingModule({
      imports: [AdminComponent],
      providers: [
        provideRouter([]),
        { provide: FirestoreService, useValue: fsMock },
        { provide: AuthService, useValue: authMock },
        { provide: RoleService, useValue: roleMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should switch tabs between sessions and settings', () => {
    expect(component.activeTab()).toBe('sessions');
    component.activeTab.set('settings');
    expect(component.activeTab()).toBe('settings');
  });
});
