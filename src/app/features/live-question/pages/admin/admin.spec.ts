import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import AdminComponent from './admin';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { RoleService } from '../../../../core/auth/services/role.service';
import { FirestoreService } from '../../../../core/firestore/firestore.service';
import { TshirtOrderService } from '../../../event/services/tshirt-order.service';

describe('AdminComponent', () => {
  let component: AdminComponent;
  let fixture: ComponentFixture<AdminComponent>;
  let fsMock: any;
  let authMock: any;
  let roleMock: any;
  let tshirtOrderMock: any;

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
      isViewer: signal(false),
      isStaff: signal(false),
      isContentManager: signal(false),
      transferAdminRole: jasmine.createSpy('transferAdminRole').and.resolveTo(),
    };
    tshirtOrderMock = {
      getOrders: jasmine.createSpy('getOrders').and.returnValue(of([])),
      updateDelivered: jasmine.createSpy('updateDelivered').and.resolveTo(),
    };

    await TestBed.configureTestingModule({
      imports: [AdminComponent],
      providers: [
        provideRouter([]),
        { provide: FirestoreService, useValue: fsMock },
        { provide: AuthService, useValue: authMock },
        { provide: RoleService, useValue: roleMock },
        { provide: TshirtOrderService, useValue: tshirtOrderMock },
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
