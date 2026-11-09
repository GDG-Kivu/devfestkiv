import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Subject, of, throwError } from 'rxjs';
import { AdminTshirtOrders } from './admin-tshirt-orders';
import { TshirtOrderData, TshirtOrderService } from '../../../../event/services/tshirt-order.service';
import { FirestoreService } from '../../../../../core/firestore/firestore.service';
import { AuthService } from '../../../../../core/auth/services/auth.service';
import { RoleService } from '../../../../../core/auth/services/role.service';

describe('AdminTshirtOrders', () => {
  let fixture: ComponentFixture<AdminTshirtOrders>;
  let component: AdminTshirtOrders;
  let service: jasmine.SpyObj<TshirtOrderService>;
  const orders: TshirtOrderData[] = [
    { id: 'one', name: 'Alice', email: 'alice@example.com', phone: '123', location: 'Bukavu', commune: 'Ibanda', place: 'Poste', sizes: { S: 0, M: 2, L: 0, XL: 0, XXL: 0 } },
    { id: 'two', name: 'Béatrice', email: 'bea@example.com', phone: '456', location: "À l'événement", commune: '', place: '', sizes: { S: 1, M: 0, L: 0, XL: 0, XXL: 0 }, delivered: true, assignedToEmail: 'staff@example.com', assignedToName: 'Staff' },
  ];

  beforeEach(async () => {
    service = jasmine.createSpyObj<TshirtOrderService>('TshirtOrderService', ['getOrders', 'assignOrders', 'updateDelivered', 'updateContacted']);
    service.getOrders.and.returnValue(of(orders));
    service.assignOrders.and.resolveTo();
    service.updateDelivered.and.resolveTo();
    service.updateContacted.and.resolveTo();
    await TestBed.configureTestingModule({
      imports: [AdminTshirtOrders],
      providers: [
        { provide: TshirtOrderService, useValue: service },
        { provide: FirestoreService, useValue: { getAvailableEditions: () => of(['2026', '2025']), getCurrentEditionId: () => of('2026') } },
        { provide: RoleService, useValue: { getStaffMembers: () => of([{ uid: 'staff', email: 'staff@example.com', displayName: 'Staff' }]), profile: signal({ displayName: 'Admin' }) } },
        { provide: AuthService, useValue: { user: signal({ email: 'admin@example.com' }) } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(AdminTshirtOrders);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('filters and sorts orders without changing totals', () => {
    component.status.set('pending');
    expect(component.filteredOrders().map(order => order.name)).toEqual(['Alice']);
    expect(component.totalPieces()).toBe(3);
    component.status.set('all');
    component.search.set('béa');
    expect(component.filteredOrders().map(order => order.name)).toEqual(['Béatrice']);
  });

  it('selects only visible rows and clears selections when changing editions', () => {
    component.status.set('pending');
    component.toggleVisible(true);
    expect([...component.selectedIds()]).toEqual(['one']);
    component.changeEdition('2025');
    expect(component.selectedCount()).toBe(0);
    expect(service.getOrders).toHaveBeenCalledWith('2025');
  });

  it('paginates the filtered list and resets the page when filters or edition change', () => {
    component.orders.set(Array.from({ length: 23 }, (_, index) => ({
      ...orders[0], id: String(index), name: `Personne ${index}`,
    })));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('tbody tr').length).toBe(10);
    component.changePage(3);
    fixture.detectChanges();
    expect(component.currentPage()).toBe(3);
    expect(fixture.nativeElement.querySelectorAll('tbody tr').length).toBe(3);
    expect(fixture.nativeElement.querySelector('.pagination').textContent).toContain('21–23');
    component.search.set('Personne');
    expect(component.currentPage()).toBe(1);
    component.changePage(2);
    component.sort.set('name');
    expect(component.currentPage()).toBe(1);
    component.changePage(2);
    component.changeEdition('2025');
    expect(component.currentPage()).toBe(1);
  });

  it('clamps the current page when realtime results shrink without resetting on ordinary updates', () => {
    const stream = new Subject<TshirtOrderData[]>();
    service.getOrders.and.returnValue(stream);
    component.changeEdition('2025');
    const many = Array.from({ length: 23 }, (_, index) => ({ ...orders[0], id: String(index) }));
    stream.next(many);
    component.changePage(3);
    stream.next([...many]);
    expect(component.currentPage()).toBe(3);
    stream.next(many.slice(0, 12));
    expect(component.currentPage()).toBe(2);
    expect(component.pagedOrders().length).toBe(2);
  });

  it('selects all filtered orders across pages and retains selection when filtering', () => {
    component.orders.set(Array.from({ length: 23 }, (_, index) => ({
      ...orders[0], id: String(index), name: `Personne ${index}`,
    })));
    component.changePage(2);
    fixture.detectChanges();
    const selectAll: HTMLInputElement = fixture.nativeElement.querySelector('thead input');
    expect(selectAll.getAttribute('aria-label')).toContain('toutes les commandes filtrées');
    selectAll.click();
    expect(component.selectedCount()).toBe(23);
    component.search.set('Personne 1');
    expect(component.selectedCount()).toBe(23);
    expect(component.allVisibleSelected()).toBeTrue();
  });

  it('shows an accessible skeleton instead of zero metrics while loading', () => {
    service.getOrders.and.returnValue(new Subject<TshirtOrderData[]>());
    component.changeEdition('2025');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="status"]').getAttribute('aria-label')).toBe('Chargement des commandes');
    expect(fixture.nativeElement.querySelectorAll('.skeleton-row').length).toBe(5);
    expect(fixture.nativeElement.querySelector('[aria-label="Résumé des commandes"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('.list-toolbar')).toBeNull();
  });

  it('opens order details in a modal and keeps checkbox clicks separate', () => {
    const checkbox: HTMLInputElement = fixture.nativeElement.querySelector('tbody input');
    checkbox.click();
    expect(component.selectedCount()).toBe(1);
    const dialog: HTMLDialogElement = fixture.nativeElement.querySelector('dialog');
    expect(dialog.open).toBeFalse();
    const row: HTMLTableRowElement = fixture.nativeElement.querySelector('tbody tr');
    row.click();
    expect(dialog.open).toBeTrue();
    expect(dialog.textContent).toContain('Alice');
    const bounds = dialog.getBoundingClientRect();
    expect(Math.abs(bounds.left + bounds.width / 2 - document.documentElement.clientWidth / 2)).toBeLessThan(2);
    component.closeOrder();
    expect(dialog.open).toBeFalse();
  });

  it('assigns the selected orders to a staff email independently of delivery', async () => {
    component.toggleVisible(true);
    component.bulkAssignee.set('staff@example.com');
    await component.assignSelected();
    expect(service.assignOrders).toHaveBeenCalledWith(['one', 'two'], '2026', { email: 'staff@example.com', name: 'Staff' });
    expect(service.updateDelivered).not.toHaveBeenCalled();
    expect(component.selectedCount()).toBe(0);
  });

  it('keeps selection and reports assignment errors', async () => {
    service.assignOrders.and.rejectWith(new Error('Permission refusée'));
    component.toggleVisible(true);
    await component.assignSelected();
    expect(component.error()).toContain('Permission refusée');
    expect(component.selectedCount()).toBe(2);
  });

  it('reports loading failures instead of showing an empty list', () => {
    service.getOrders.and.returnValue(throwError(() => new Error('offline')));
    component.changeEdition('2025');
    expect(component.loading()).toBeFalse();
    expect(component.error()).toContain('Impossible de charger');
  });

  it('requires valid delivery details and updates status', async () => {
    component.selectedOrder.set(orders[0]);
    component.deliveredBy.set('');
    component.deliveredAt.set('');
    await component.changeDelivery(true);
    expect(service.updateDelivered).not.toHaveBeenCalled();
    component.deliveredBy.set('Staff');
    component.deliveredAt.set('2026-11-09T10:00');
    await component.changeDelivery(true);
    expect(service.updateDelivered).toHaveBeenCalled();
    expect(component.selectedOrder()?.delivered).toBeTrue();
  });

  it('filters contact status independently of delivery', () => {
    component.orders.set([orders[0], { ...orders[1], contacted: true }]);
    component.contactFilter.set('not-contacted');
    expect(component.filteredOrders().map(order => order.name)).toEqual(['Alice']);
    component.contactFilter.set('contacted');
    expect(component.filteredOrders().map(order => order.name)).toEqual(['Béatrice']);
  });

  it('requires confirmation and a valid international number before recording contact', async () => {
    component.openOrder({ ...orders[0], phone: '+243 840 387 553' });
    component.requestContact();
    const dialog: HTMLDialogElement = fixture.nativeElement.querySelector('.contact-dialog');
    expect(dialog.open).toBeTrue();
    expect(component.contactUrl()).toBe('https://wa.me/243840387553');
    component.closeContact();
    expect(service.updateContacted).not.toHaveBeenCalled();

    component.requestContact();
    component.contactPhone.set('0840387553');
    const invalid = new MouseEvent('click', { cancelable: true });
    component.confirmContact(invalid);
    expect(invalid.defaultPrevented).toBeTrue();
    expect(service.updateContacted).not.toHaveBeenCalled();
    expect(component.contactError()).toContain('indicatif international');

    component.contactPhone.set('00243 840 387 553');
    component.confirmContact(new MouseEvent('click', { cancelable: true }));
    await fixture.whenStable();
    expect(service.updateContacted).toHaveBeenCalledWith('one', '2026', true);
    expect(component.selectedOrder()?.contacted).toBeTrue();
    expect(component.selectedOrder()?.delivered).toBeFalsy();
    expect(dialog.open).toBeFalse();
  });

  it('reports a failed contact update and allows correcting contact status', async () => {
    component.openOrder({ ...orders[0], phone: '+243840387553' });
    component.requestContact();
    service.updateContacted.and.rejectWith(new Error('Permission refusée'));
    component.confirmContact(new MouseEvent('click', { cancelable: true }));
    await fixture.whenStable();
    expect(component.modalError()).toContain('Statut de contact non enregistré');
    expect(component.selectedOrder()?.contacted).toBeFalsy();
    service.updateContacted.and.resolveTo();
    await component.updateContacted(false);
    expect(service.updateContacted).toHaveBeenCalledWith('one', '2026', false);
  });

  it('opens the confirmed WhatsApp link in a new tab and records contact', async () => {
    component.openOrder({ ...orders[0], phone: '+243 840 387 553' });
    component.requestContact();
    fixture.detectChanges();
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('.contact-link');
    expect(link.href).toBe('https://wa.me/243840387553');
    expect(link.target).toBe('_blank');
    link.addEventListener('click', event => event.preventDefault());
    link.click();
    await fixture.whenStable();
    expect(service.updateContacted).toHaveBeenCalledOnceWith('one', '2026', true);
  });

  it('exports selected orders as an Excel workbook with text cells', async () => {
    let exported: Blob | undefined;
    spyOn(URL, 'createObjectURL').and.callFake(value => {
      if (value instanceof Blob) exported = value;
      return 'blob:test';
    });
    spyOn(URL, 'revokeObjectURL');
    spyOn(HTMLAnchorElement.prototype, 'click');
    component.orders.set([{ ...orders[0], name: '=1+1' }, orders[1]]);
    component.toggleSelection('one', true);
    await component.exportOrders();
    expect(component.error()).toBe('');
    expect(exported).toBeDefined();
    const { default: ExcelJS } = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(await exported!.arrayBuffer());
    const sheet = workbook.getWorksheet('Commandes')!;
    expect(sheet.rowCount).toBe(2);
    expect(sheet.getCell('B2').value).toBe('=1+1');
    expect(sheet.getCell('I2').value).toBe(2);
    expect(sheet.getCell('T2').value).toBe('Non contacté');
  });

  it('exports the filtered list when nothing is selected', async () => {
    let exported: Blob | undefined;
    spyOn(URL, 'createObjectURL').and.callFake(value => {
      if (value instanceof Blob) exported = value;
      return 'blob:test';
    });
    spyOn(URL, 'revokeObjectURL');
    spyOn(HTMLAnchorElement.prototype, 'click');
    component.status.set('delivered');
    await component.exportOrders();
    expect(component.error()).toBe('');
    const { default: ExcelJS } = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(await exported!.arrayBuffer());
    const sheet = workbook.getWorksheet('Commandes')!;
    expect(sheet.rowCount).toBe(2);
    expect(sheet.getCell('B2').value).toBe('Béatrice');
  });

  it('exports all filtered orders, not only the current page', async () => {
    let exported: Blob | undefined;
    spyOn(URL, 'createObjectURL').and.callFake(value => {
      if (value instanceof Blob) exported = value;
      return 'blob:test';
    });
    spyOn(URL, 'revokeObjectURL');
    spyOn(HTMLAnchorElement.prototype, 'click');
    component.orders.set(Array.from({ length: 23 }, (_, index) => ({ ...orders[0], id: String(index) })));
    component.changePage(2);
    await component.exportOrders();
    expect(component.error()).toBe('');
    const { default: ExcelJS } = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(await exported!.arrayBuffer());
    expect(workbook.getWorksheet('Commandes')!.rowCount).toBe(24);
  });

  it('previews all filtered orders across pages and opens the print dialog on demand', () => {
    const frame = document.createElement('iframe');
    document.body.appendChild(frame);
    try {
      const preview = frame.contentWindow!;
      const print = spyOn(preview, 'print');
      spyOn(window, 'open').and.returnValue(preview);
      component.orders.set(Array.from({ length: 23 }, (_, index) => ({
        ...orders[0], id: String(index), name: `Personne ${index}`,
      })));
      component.changePage(2);
      component.printOrders();
      const doc = preview.document;
      expect(doc.title).toBe('Commandes T-shirts - 2026');
      expect(doc.querySelectorAll('tbody tr').length).toBe(23);
      expect(doc.querySelector('main p')?.textContent).toContain('Liste filtrée');
      expect(print).not.toHaveBeenCalled();
      doc.querySelector('button')!.click();
      expect(print).toHaveBeenCalledTimes(1);
    } finally {
      frame.remove();
    }
  });

  it('prints selected orders even when they are hidden by the current filter and renders text safely', () => {
    const frame = document.createElement('iframe');
    document.body.appendChild(frame);
    try {
      spyOn(window, 'open').and.returnValue(frame.contentWindow!);
      component.orders.set([{ ...orders[0], name: '<img src=x onerror=alert(1)>' }, orders[1]]);
      component.toggleSelection('one', true);
      component.status.set('delivered');
      component.printOrders();
      const doc = frame.contentDocument!;
      expect(doc.querySelectorAll('tbody tr').length).toBe(1);
      expect(doc.querySelector('tbody')?.textContent).toContain('<img src=x onerror=alert(1)>');
      expect(doc.querySelector('tbody img')).toBeNull();
      expect(doc.querySelector('main p')?.textContent).toContain('Sélection');
    } finally {
      frame.remove();
    }
  });

  it('reports an empty print list or a blocked preview window', () => {
    const open = spyOn(window, 'open').and.returnValue(null);
    component.search.set('introuvable');
    component.printOrders();
    expect(component.error()).toContain('Aucune commande à imprimer');
    expect(open).not.toHaveBeenCalled();
    component.search.set('');
    component.printOrders();
    expect(component.error()).toContain('fenêtres contextuelles');
  });
});
