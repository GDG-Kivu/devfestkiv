import { TestBed } from '@angular/core/testing';
import { Auth } from '@angular/fire/auth';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { AdminCms } from './admin-cms/admin-cms';
import { AdminSettings } from './admin-settings/admin-settings';
import { FirestoreService } from '../../../../core/firestore/firestore.service';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { RoleService } from '../../../../core/auth/services/role.service';

describe('Admin content and team sections', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminCms, AdminSettings],
      providers: [
        provideRouter([]),
        { provide: Auth, useValue: { currentUser: null } },
        { provide: AuthService, useValue: { user: signal(null) } },
        { provide: RoleService, useValue: {
          profile: signal(null),
          getViewers: () => of([{ uid: 'viewer', email: 'viewer@example.com', displayName: 'Viewer' }]),
          getStaffMembers: () => of([]),
          getContentManagers: () => of([]),
        } },
        { provide: FirestoreService, useValue: {
          getAvailableEditions: () => of(['2026', '2025']),
          getCurrentEditionId: () => of('2026'),
          getEvent: () => of(null),
          getEventCollection: () => of([]),
        } },
      ],
    }).compileComponents();
  });

  it('displays the content modules and keeps the edition and edit controls working', () => {
    const fixture = TestBed.createComponent(AdminCms);
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;
    expect(root.querySelector('h1')?.textContent).toContain('Gestion des contenus');
    expect(root.querySelectorAll('.module-list > div').length).toBe(7);
    const select = root.querySelector<HTMLSelectElement>('#editionSelector')!;
    select.value = '2025';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(fixture.componentInstance.selectedEditionId()).toBe('2025');
    expect(root.textContent).toContain('Activer sur le site');
    root.querySelector<HTMLButtonElement>('.module-list button')!.click();
    expect(fixture.componentInstance.activeModal()).toBe('config');
  });

  it('displays the roles and retains their add, remove and transfer actions', () => {
    const fixture = TestBed.createComponent(AdminSettings);
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;
    expect(root.querySelector('h1')?.textContent).toContain('Paramètres & équipe');
    expect(root.querySelectorAll('.team-list > div').length).toBe(3);
    expect(root.textContent).toContain('viewer@example.com');
    root.querySelector<HTMLButtonElement>('.team-list > div:first-child button')!.click();
    expect(fixture.componentInstance.showAddModal()).toBeTrue();
    root.querySelector<HTMLButtonElement>('.team-list > div:first-child div:last-child button')!.click();
    expect(fixture.componentInstance.viewerToRemove()?.uid).toBe('viewer');
    root.querySelector<HTMLButtonElement>('.transfer-section button')!.click();
    expect(fixture.componentInstance.showTransferModal()).toBeTrue();
  });
});
