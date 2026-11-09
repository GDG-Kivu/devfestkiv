import { ChangeDetectionStrategy, Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { TshirtOrderData, TshirtOrderService } from '../../../../event/services/tshirt-order.service';
import { AuthService } from '../../../../../core/auth/services/auth.service';
import { RoleService } from '../../../../../core/auth/services/role.service';
import { FirestoreService } from '../../../../../core/firestore/firestore.service';

const toIsoLocalString = (d: Date): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

@Component({
  selector: 'app-admin-tshirt-orders',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-tshirt-orders.html',
  styles: `
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in {
      animation: fadeIn 0.2s ease-out forwards;
    }
    @keyframes popIn {
      0% { opacity: 0; transform: scale(0.96) translateY(-6px); }
      100% { opacity: 1; transform: scale(1) translateY(0); }
    }
    .animate-pop-in {
      animation: popIn 0.18s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
  `,
})
export class AdminTshirtOrders implements OnInit, OnDestroy {
  private readonly tshirtService = inject(TshirtOrderService);
  readonly fs = inject(FirestoreService);
  readonly auth = inject(AuthService);
  readonly roles = inject(RoleService);

  readonly availableSizes: ReadonlyArray<'S' | 'M' | 'L' | 'XL' | 'XXL'> = ['S', 'M', 'L', 'XL', 'XXL'];

  // Editions state
  availableEditions = signal<string[]>([]);
  selectedEditionId = signal<string>('');
  liveEditionId = signal<string>('');

  // Orders state
  orders = signal<TshirtOrderData[]>([]);
  isLoading = signal(true);
  searchQuery = signal('');
  statusFilter = signal<'all' | 'delivered' | 'pending'>('all');
  locationFilter = signal<'all' | 'event' | 'bukavu'>('all');

  // Modal dialog state
  deliveryModalOrder = signal<TshirtOrderData | null>(null);
  deliveryDeliveredBy = signal('');
  deliveryDeliveredAt = signal('');
  isSubmittingDelivery = signal(false);
  deliveryError = signal('');

  private subs = new Subscription();
  private ordersSub?: Subscription;

  // Computed metrics
  readonly totalOrders = computed(() => this.orders().length);

  readonly totalTshirts = computed(() =>
    this.orders().reduce((total, o) => total + this.getOrderTotal(o), 0),
  );

  readonly deliveredOrders = computed(() =>
    this.orders().filter((o) => o.delivered === true).length,
  );

  readonly pendingOrders = computed(() =>
    this.orders().filter((o) => !o.delivered).length,
  );

  readonly deliveryPercentage = computed(() => {
    const total = this.totalOrders();
    return total === 0 ? 0 : Math.round((this.deliveredOrders() / total) * 100);
  });

  readonly sizesBreakdown = computed(() => {
    const counts: Record<string, number> = { S: 0, M: 0, L: 0, XL: 0, XXL: 0 };
    for (const order of this.orders()) {
      if (order.sizes) {
        for (const s of this.availableSizes) {
          counts[s] = (counts[s] || 0) + (Number(order.sizes[s]) || 0);
        }
      }
    }
    return counts;
  });

  readonly locationBreakdown = computed(() => {
    let event = 0;
    let bukavu = 0;
    for (const order of this.orders()) {
      if (this.isEventLocation(order.location)) event++;
      else bukavu++;
    }
    return { event, bukavu };
  });

  readonly filteredOrders = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const status = this.statusFilter();
    const loc = this.locationFilter();

    return this.orders().filter((order) => {
      if (status === 'delivered' && !order.delivered) return false;
      if (status === 'pending' && order.delivered) return false;

      if (loc === 'event' && !this.isEventLocation(order.location)) return false;
      if (loc === 'bukavu' && this.isEventLocation(order.location)) return false;

      if (q) {
        const str = `${order.name || ''} ${order.email || ''} ${order.phone || ''} ${order.commune || ''} ${order.place || ''} ${order.deliveredBy || ''}`.toLowerCase();
        return str.includes(q);
      }
      return true;
    });
  });

  ngOnInit(): void {
    this.subs.add(
      this.fs.getAvailableEditions().subscribe((eds) => {
        if (eds?.length) this.availableEditions.set(eds);
      }),
    );

    this.subs.add(
      this.fs.getCurrentEditionId().subscribe((liveId) => {
        this.liveEditionId.set(liveId);
        if (!this.selectedEditionId()) {
          this.selectedEditionId.set(liveId);
          this.loadOrders(liveId);
        }
      }),
    );
  }

  onEditionChange(newEdition: string): void {
    this.selectedEditionId.set(newEdition);
    this.loadOrders(newEdition);
  }

  loadOrders(editionId: string): void {
    this.isLoading.set(true);
    this.ordersSub?.unsubscribe();
    this.ordersSub = this.tshirtService.getOrders(editionId).subscribe({
      next: (list) => {
        this.orders.set(list || []);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  isEventLocation(location?: string): boolean {
    return location === "À l'événement";
  }

  getOrderTotal(order: TshirtOrderData): number {
    if (!order.sizes) return 0;
    return this.availableSizes.reduce((sum, s) => sum + (Number(order.sizes[s]) || 0), 0);
  }

  formatDate(createdAt: any): string {
    if (!createdAt) return '—';
    try {
      const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
      return new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch {
      return '—';
    }
  }

  toggleDelivered(order: TshirtOrderData): void {
    this.openDeliveryModal(order);
  }

  openDeliveryModal(order: TshirtOrderData): void {
    this.deliveryModalOrder.set(order);
    this.deliveryError.set('');

    const defaultName = order.delivered && order.deliveredBy
      ? order.deliveredBy
      : (this.roles.profile()?.displayName || this.auth.user()?.displayName || this.auth.user()?.email?.split('@')[0] || '');

    this.deliveryDeliveredBy.set(defaultName);

    let defaultDate = new Date();
    if (order.delivered && order.deliveredAt) {
      try {
        defaultDate = order.deliveredAt.toDate ? order.deliveredAt.toDate() : new Date(order.deliveredAt);
      } catch {
        defaultDate = new Date();
      }
    }
    this.deliveryDeliveredAt.set(toIsoLocalString(defaultDate));
  }

  closeDeliveryModal(): void {
    if (this.isSubmittingDelivery()) return;
    this.deliveryModalOrder.set(null);
    this.deliveryError.set('');
  }

  confirmDelivery(markDelivered: boolean): void {
    const order = this.deliveryModalOrder();
    if (!order?.id) return;

    this.isSubmittingDelivery.set(true);
    this.deliveryError.set('');

    const edition = this.selectedEditionId() || order.editionId || this.liveEditionId();
    const name = this.deliveryDeliveredBy().trim() || 'Staff';
    const date = this.deliveryDeliveredAt() ? new Date(this.deliveryDeliveredAt()) : new Date();

    this.tshirtService
      .updateDelivered(order.id, markDelivered, edition, { deliveredBy: name, deliveredAt: date })
      .then(() => {
        this.orders.update((list) =>
          list.map((o) =>
            o.id === order.id
              ? { ...o, delivered: markDelivered, deliveredBy: markDelivered ? name : null, deliveredAt: markDelivered ? date : null }
              : o,
          ),
        );
        this.deliveryModalOrder.set(null);
      })
      .catch((err) => {
        this.deliveryError.set(err?.message || 'Erreur lors de la mise à jour.');
      })
      .finally(() => {
        this.isSubmittingDelivery.set(false);
      });
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    this.ordersSub?.unsubscribe();
  }
}
export default AdminTshirtOrders;
