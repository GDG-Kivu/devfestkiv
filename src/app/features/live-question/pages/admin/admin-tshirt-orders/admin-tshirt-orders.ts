import { ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, ElementRef, inject, linkedSignal, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { TshirtOrderData, TshirtOrderService } from '../../../../event/services/tshirt-order.service';
import { FirestoreService } from '../../../../../core/firestore/firestore.service';
import { AuthService } from '../../../../../core/auth/services/auth.service';
import { RoleService } from '../../../../../core/auth/services/role.service';
import { UserProfile } from '../../../../../core/auth/models/user-profile.model';
import { renderOrdersPrintPreview } from './print-orders';

type SortKey = 'date' | 'name' | 'status';

@Component({
  selector: 'app-admin-tshirt-orders',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-tshirt-orders.html',
  styleUrl: './admin-tshirt-orders.css',
})
export class AdminTshirtOrders implements OnInit, OnDestroy {
  @ViewChild('orderDialog') private orderDialog?: ElementRef<HTMLDialogElement>;
  @ViewChild('contactDialog') private contactDialog?: ElementRef<HTMLDialogElement>;

  private readonly tshirtService = inject(TshirtOrderService);
  private readonly fs = inject(FirestoreService);
  private readonly auth = inject(AuthService);
  private readonly roles = inject(RoleService);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly subs = new Subscription();
  private ordersSub?: Subscription;

  readonly sizes = ['S', 'M', 'L', 'XL', 'XXL'] as const;
  readonly editions = signal<string[]>([]);
  readonly edition = signal('');
  readonly liveEdition = signal('');
  readonly orders = signal<TshirtOrderData[]>([]);
  readonly staff = signal<UserProfile[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly notice = signal('');
  readonly search = signal('');
  readonly status = signal('all');
  readonly contactFilter = signal('all');
  readonly location = signal('all');
  readonly assigneeFilter = signal('all');
  readonly sort = signal<SortKey>('date');
  readonly pageSize = 10;
  readonly requestedPage = linkedSignal(() => {
    this.search(); this.status(); this.contactFilter(); this.location();
    this.assigneeFilter(); this.sort(); this.edition();
    return 1;
  });
  readonly selectedIds = signal<Set<string>>(new Set());
  readonly bulkAssignee = signal('');
  readonly selectedOrder = signal<TshirtOrderData | null>(null);
  readonly modalAssignee = signal('');
  readonly deliveredBy = signal('');
  readonly deliveredAt = signal('');
  readonly saving = signal(false);
  readonly modalError = signal('');
  readonly contactPhone = signal('');
  readonly contactError = signal('');

  readonly contactUrl = computed(() => {
    const phone = this.contactPhone().trim();
    if (!/^(?:\+|00)[0-9\s().-]+$/.test(phone)) return '';
    let digits = phone.replace(/\D/g, '');
    if (digits.startsWith('00')) digits = digits.slice(2);
    return /^[1-9]\d{7,14}$/.test(digits) ? `https://wa.me/${digits}` : '';
  });

  readonly filteredOrders = computed(() => {
    const search = this.search().trim().toLocaleLowerCase();
    const result = this.orders().filter(order => {
      if (this.status() === 'pending' && order.delivered) return false;
      if (this.status() === 'delivered' && !order.delivered) return false;
      if (this.contactFilter() === 'contacted' && !order.contacted) return false;
      if (this.contactFilter() === 'not-contacted' && order.contacted) return false;
      const event = order.location === "À l'événement";
      if (this.location() === 'event' && !event) return false;
      if (this.location() === 'bukavu' && event) return false;
      if (this.assigneeFilter() === 'unassigned' && order.assignedToEmail) return false;
      if (this.assigneeFilter() !== 'all' && this.assigneeFilter() !== 'unassigned' &&
          order.assignedToEmail?.toLowerCase() !== this.assigneeFilter().toLowerCase()) return false;
      return !search || [order.name, order.email, order.phone, order.commune, order.place, order.assignedToName]
        .some(value => value?.toLocaleLowerCase().includes(search));
    });
    if (this.sort() === 'name') return result.sort((a, b) => a.name.localeCompare(b.name, 'fr'));
    if (this.sort() === 'status') return result.sort((a, b) => Number(!!a.delivered) - Number(!!b.delivered));
    return result;
  });

  readonly pageCount = computed(() => Math.max(1, Math.ceil(this.filteredOrders().length / this.pageSize)));
  readonly currentPage = computed(() => Math.min(this.requestedPage(), this.pageCount()));
  readonly pageStart = computed(() => (this.currentPage() - 1) * this.pageSize);
  readonly pageEnd = computed(() => Math.min(this.pageStart() + this.pageSize, this.filteredOrders().length));
  readonly pagedOrders = computed(() => this.filteredOrders().slice(this.pageStart(), this.pageEnd()));

  changePage(page: number): void {
    this.requestedPage.set(Math.max(1, Math.min(page, this.pageCount())));
  }

  readonly allVisibleSelected = computed(() => {
    const visible = this.filteredOrders().filter(order => order.id);
    return visible.length > 0 && visible.every(order => this.selectedIds().has(order.id!));
  });
  readonly selectedCount = computed(() => this.selectedIds().size);
  readonly outputOrders = computed(() => {
    const selected = this.selectedIds();
    return selected.size ? this.orders().filter(order => order.id && selected.has(order.id)) : this.filteredOrders();
  });
  readonly totalPieces = computed(() => this.orders().reduce((sum, order) => sum + this.orderTotal(order), 0));
  readonly deliveredCount = computed(() => this.orders().filter(order => order.delivered).length);

  ngOnInit(): void {
    this.subs.add(this.fs.getAvailableEditions().subscribe({
      next: editions => this.editions.set(editions),
      error: () => this.error.set('Impossible de charger les éditions.'),
    }));
    this.subs.add(this.fs.getCurrentEditionId().subscribe({
      next: id => {
        this.liveEdition.set(id);
        if (!this.edition()) this.changeEdition(id);
      },
      error: () => { this.loading.set(false); this.error.set('Impossible de charger l’édition active.'); },
    }));
    this.subs.add(this.roles.getStaffMembers().subscribe({
      next: staff => this.staff.set(staff.filter(member => !member.disabled && !!member.email)),
      error: () => this.error.set('Impossible de charger la liste du staff.'),
    }));
  }

  changeEdition(id: string): void {
    this.edition.set(id);
    this.selectedIds.set(new Set());
    this.orders.set([]);
    this.loading.set(true);
    this.error.set('');
    this.ordersSub?.unsubscribe();
    this.ordersSub = this.tshirtService.getOrders(id).subscribe({
      next: orders => { this.orders.set(orders); this.loading.set(false); },
      error: () => { this.loading.set(false); this.error.set('Impossible de charger les commandes.'); },
    });
  }

  orderTotal(order: TshirtOrderData): number {
    return this.sizes.reduce((sum, size) => sum + (Number(order.sizes?.[size]) || 0), 0);
  }

  formatDate(value: unknown): string {
    if (!value) return '—';
    const date = value instanceof Date ? value : typeof value === 'object' && 'toDate' in value &&
      typeof value.toDate === 'function' ? value.toDate() : new Date(String(value));
    return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'medium', timeStyle: 'short',
    }).format(date);
  }

  toggleSelection(id: string, checked: boolean): void {
    this.selectedIds.update(current => {
      const next = new Set(current);
      if (checked) next.add(id); else next.delete(id);
      return next;
    });
  }

  toggleVisible(checked: boolean): void {
    this.selectedIds.update(current => {
      const next = new Set(current);
      for (const order of this.filteredOrders()) {
        if (order.id) checked ? next.add(order.id) : next.delete(order.id);
      }
      return next;
    });
  }

  clearSelection(): void {
    this.selectedIds.set(new Set());
  }

  hasStaff(email: string): boolean {
    return this.staff().some(member => member.email?.toLowerCase() === email.toLowerCase());
  }

  openOrder(order: TshirtOrderData): void {
    this.selectedOrder.set(order);
    this.modalAssignee.set(order.assignedToEmail || '');
    this.deliveredBy.set(order.deliveredBy || this.roles.profile()?.displayName || this.auth.user()?.email || '');
    const date = order.deliveredAt?.toDate ? order.deliveredAt.toDate() : order.deliveredAt ? new Date(order.deliveredAt) : new Date();
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    this.deliveredAt.set(Number.isNaN(local.getTime()) ? '' : local.toISOString().slice(0, 16));
    this.modalError.set('');
    this.changeDetector.detectChanges();
    this.orderDialog?.nativeElement.showModal();
  }

  closeOrder(): void {
    if (!this.saving()) this.orderDialog?.nativeElement.close();
  }

  onDialogCancel(event: Event): void {
    if (this.saving()) event.preventDefault();
  }

  requestContact(): void {
    const order = this.selectedOrder();
    if (!order?.id) {
      this.modalError.set('Impossible de contacter cette commande.');
      return;
    }
    this.modalError.set('');
    this.contactError.set('');
    this.contactPhone.set(order.phone);
    this.changeDetector.detectChanges();
    this.contactDialog?.nativeElement.showModal();
  }

  closeContact(): void {
    if (!this.saving()) this.contactDialog?.nativeElement.close();
  }

  confirmContact(event: MouseEvent): void {
    if (this.saving()) {
      event.preventDefault();
      return;
    }
    if (!this.contactUrl()) {
      event.preventDefault();
      this.contactError.set('Indiquez un numéro valide avec son indicatif international, par exemple +243.');
      return;
    }
    void this.updateContacted(true);
  }

  async updateContacted(contacted: boolean): Promise<void> {
    const order = this.selectedOrder();
    if (!order?.id) {
      this.modalError.set('Impossible de modifier le statut de contact.');
      return;
    }
    this.saving.set(true);
    this.modalError.set('');
    try {
      await this.tshirtService.updateContacted(order.id, this.edition(), contacted);
      this.selectedOrder.set({ ...order, contacted, contactedAt: contacted ? new Date() : null });
      this.contactDialog?.nativeElement.close();
    } catch (error) {
      this.modalError.set(error instanceof Error
        ? `Statut de contact non enregistré : ${error.message}`
        : 'Statut de contact non enregistré.');
      this.contactDialog?.nativeElement.close();
    } finally {
      this.saving.set(false);
    }
  }

  private assignee(email: string): { email: string; name: string } | null {
    if (!email) return null;
    const member = this.staff().find(person => person.email?.toLowerCase() === email.toLowerCase());
    if (!member?.email) throw new Error('Ce membre du staff n’est plus disponible.');
    return { email: member.email.toLowerCase(), name: member.displayName?.trim() || member.email };
  }

  async assignSelected(): Promise<void> {
    if (!this.selectedCount()) return;
    this.saving.set(true);
    this.error.set('');
    this.notice.set('');
    try {
      await this.tshirtService.assignOrders([...this.selectedIds()], this.edition(), this.assignee(this.bulkAssignee()));
      this.selectedIds.set(new Set());
      this.notice.set('Attribution mise à jour.');
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Impossible de modifier l’attribution.');
    } finally { this.saving.set(false); }
  }

  async saveAssignment(): Promise<void> {
    const order = this.selectedOrder();
    if (!order?.id) return;
    this.saving.set(true);
    this.modalError.set('');
    try {
      const assignee = this.assignee(this.modalAssignee());
      await this.tshirtService.assignOrders([order.id], this.edition(), assignee);
      this.selectedOrder.set({ ...order, assignedToEmail: assignee?.email ?? null, assignedToName: assignee?.name ?? null });
      this.notice.set('Attribution mise à jour.');
    } catch (error) {
      this.modalError.set(error instanceof Error ? error.message : 'Impossible de modifier l’attribution.');
    } finally { this.saving.set(false); }
  }

  async changeDelivery(delivered: boolean): Promise<void> {
    const order = this.selectedOrder();
    if (!order?.id) return;
    const date = new Date(this.deliveredAt());
    if (delivered && (!this.deliveredBy().trim() || Number.isNaN(date.getTime()))) {
      this.modalError.set('Indiquez le nom de la personne et une date de remise valide.');
      return;
    }
    this.saving.set(true);
    this.modalError.set('');
    try {
      await this.tshirtService.updateDelivered(order.id, delivered, this.edition(), {
        deliveredBy: this.deliveredBy(), deliveredAt: date,
      });
      this.selectedOrder.set({ ...order, delivered, deliveredBy: delivered ? this.deliveredBy() : null, deliveredAt: delivered ? date : null });
      this.notice.set('Statut de la commande mis à jour.');
    } catch (error) {
      this.modalError.set(error instanceof Error ? error.message : 'Impossible de modifier le statut.');
    } finally { this.saving.set(false); }
  }

  printOrders(): void {
    this.error.set('');
    const rows = this.outputOrders();
    if (!rows.length) { this.error.set('Aucune commande à imprimer.'); return; }
    const preview = window.open('', '_blank');
    if (!preview) {
      this.error.set('Impossible d’ouvrir l’aperçu. Autorisez les fenêtres contextuelles et réessayez.');
      return;
    }
    try {
      renderOrdersPrintPreview(preview.document, this.edition(), rows, this.selectedCount() ? 'selection' : 'filtered', () => preview.print());
    } catch (error) {
      preview.close();
      this.error.set(error instanceof Error ? `Aperçu impossible : ${error.message}` : 'Aperçu impossible.');
    }
  }

  async exportOrders(): Promise<void> {
    this.error.set('');
    const rows = this.outputOrders();
    if (!rows.length) { this.error.set('Aucune commande à exporter.'); return; }
    try {
      const { default: ExcelJS } = await import('exceljs');
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Commandes');
      sheet.addRow(['Édition', 'Nom', 'Email', 'Téléphone', 'Lieu', 'Commune', 'Point de retrait', 'S', 'M', 'L', 'XL', 'XXL', 'Total', 'Statut', 'Attribué à', 'Email staff', 'Commandé le', 'Remis par', 'Remis le', 'Contact WhatsApp', 'Contacté le']);
      for (const order of rows) {
        sheet.addRow([this.edition(), order.name, order.email, order.phone, order.location, order.commune, order.place,
          ...this.sizes.map(size => order.sizes?.[size] || 0), this.orderTotal(order),
          order.delivered ? 'Livrée' : 'En attente', order.assignedToName || '', order.assignedToEmail || '',
          this.formatDate(order.createdAt), order.deliveredBy || '', this.formatDate(order.deliveredAt),
          order.contacted ? 'Contacté' : 'Non contacté', this.formatDate(order.contactedAt)]);
      }
      sheet.getRow(1).font = { bold: true };
      sheet.columns.forEach(column => { column.width = 20; });
      const data = await workbook.xlsx.writeBuffer();
      const url = URL.createObjectURL(new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `commandes-tshirts-${this.edition()}.xlsx`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch (error) {
      this.error.set(error instanceof Error ? `Export impossible : ${error.message}` : 'Export impossible.');
    }
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    this.ordersSub?.unsubscribe();
  }
}
export default AdminTshirtOrders;
