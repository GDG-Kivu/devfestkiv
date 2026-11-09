import { ChangeDetectionStrategy, Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { TshirtOrderData, TshirtOrderService } from '../../../../event/services/tshirt-order.service';
import { AuthService } from '../../../../../core/auth/services/auth.service';
import { RoleService } from '../../../../../core/auth/services/role.service';
import { FirestoreService } from '../../../../../core/firestore/firestore.service';

function toLocalDatetimeString(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

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
      animation: fadeIn 0.25s ease-out forwards;
    }
    @keyframes popIn {
      0% { opacity: 0; transform: scale(0.96) translateY(-8px); }
      100% { opacity: 1; transform: scale(1) translateY(0); }
    }
    .animate-pop-in {
      animation: popIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
  `,
})
export class AdminTshirtOrders implements OnInit, OnDestroy {
  private readonly tshirtService = inject(TshirtOrderService);
  readonly fs = inject(FirestoreService);
  readonly auth = inject(AuthService);
  readonly roles = inject(RoleService);

  readonly availableSizes: Array<'S' | 'M' | 'L' | 'XL' | 'XXL'> = ['S', 'M', 'L', 'XL', 'XXL'];

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

  // Modal dialog state for delivery status
  deliveryModalOrder = signal<TshirtOrderData | null>(null);
  deliveryDeliveredBy = signal<string>('');
  deliveryDeliveredAt = signal<string>('');
  isSubmittingDelivery = signal<boolean>(false);
  deliveryError = signal<string>('');

  private subs = new Subscription();
  private ordersSub?: Subscription;

  // Computed metrics
  readonly totalOrders = computed(() => this.orders().length);

  readonly totalTshirts = computed(() => {
    return this.orders().reduce((total, order) => total + this.getOrderTotal(order), 0);
  });

  readonly deliveredOrders = computed(() => {
    return this.orders().filter((o) => o.delivered === true).length;
  });

  readonly pendingOrders = computed(() => {
    return this.orders().filter((o) => !o.delivered).length;
  });

  readonly deliveryPercentage = computed(() => {
    const total = this.totalOrders();
    if (total === 0) return 0;
    return Math.round((this.deliveredOrders() / total) * 100);
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
      if (this.isEventLocation(order.location)) {
        event++;
      } else {
        bukavu++;
      }
    }
    return { event, bukavu };
  });

  // Filtered orders list based on search and filters
  readonly filteredOrders = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const status = this.statusFilter();
    const loc = this.locationFilter();

    return this.orders().filter((order) => {
      // Status filter
      if (status === 'delivered' && !order.delivered) return false;
      if (status === 'pending' && order.delivered) return false;

      // Location filter
      if (loc === 'event' && !this.isEventLocation(order.location)) return false;
      if (loc === 'bukavu' && this.isEventLocation(order.location)) return false;

      // Query filter
      if (q) {
        const nameMatch = (order.name || '').toLowerCase().includes(q);
        const emailMatch = (order.email || '').toLowerCase().includes(q);
        const phoneMatch = (order.phone || '').toLowerCase().includes(q);
        const communeMatch = (order.commune || '').toLowerCase().includes(q);
        const placeMatch = (order.place || '').toLowerCase().includes(q);
        const deliveredByMatch = (order.deliveredBy || '').toLowerCase().includes(q);
        return nameMatch || emailMatch || phoneMatch || communeMatch || placeMatch || deliveredByMatch;
      }

      return true;
    });
  });

  ngOnInit(): void {
    // 1. Listen to available editions
    this.subs.add(
      this.fs.getAvailableEditions().subscribe((eds) => {
        if (eds && eds.length > 0) {
          this.availableEditions.set(eds);
        }
      })
    );

    // 2. Listen to current live edition ID & load data
    this.subs.add(
      this.fs.getCurrentEditionId().subscribe((liveId) => {
        this.liveEditionId.set(liveId);
        if (!this.selectedEditionId()) {
          this.selectedEditionId.set(liveId);
          this.loadOrders(liveId);
        }
      })
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
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  isEventLocation(location?: string): boolean {
    return location === "À l'événement";
  }

  getOrderTotal(order: TshirtOrderData): number {
    if (!order.sizes) return 0;
    return (
      (Number(order.sizes.S) || 0) +
      (Number(order.sizes.M) || 0) +
      (Number(order.sizes.L) || 0) +
      (Number(order.sizes.XL) || 0) +
      (Number(order.sizes.XXL) || 0)
    );
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

  openDeliveryModal(order: TshirtOrderData): void {
    this.deliveryModalOrder.set(order);
    this.deliveryError.set('');

    // Pre-fill deliverer name:
    // If order already has deliveredBy, use it. Otherwise, default to current user's name
    if (order.delivered && order.deliveredBy) {
      this.deliveryDeliveredBy.set(order.deliveredBy);
    } else {
      const currentUser = this.auth.user();
      const profileName = this.roles.profile()?.displayName;
      const defaultName = profileName || currentUser?.displayName || currentUser?.email?.split('@')[0] || '';
      this.deliveryDeliveredBy.set(defaultName);
    }

    // Pre-fill delivery date/time:
    if (order.delivered && order.deliveredAt) {
      try {
        const d = order.deliveredAt.toDate ? order.deliveredAt.toDate() : new Date(order.deliveredAt);
        this.deliveryDeliveredAt.set(toLocalDatetimeString(d));
      } catch {
        this.deliveryDeliveredAt.set(toLocalDatetimeString(new Date()));
      }
    } else {
      this.deliveryDeliveredAt.set(toLocalDatetimeString(new Date()));
    }
  }

  closeDeliveryModal(): void {
    if (this.isSubmittingDelivery()) return;
    this.deliveryModalOrder.set(null);
    this.deliveryError.set('');
  }

  async confirmDelivery(markDelivered: boolean): Promise<void> {
    const order = this.deliveryModalOrder();
    if (!order?.id) return;

    this.isSubmittingDelivery.set(true);
    this.deliveryError.set('');

    const targetEdition = this.selectedEditionId() || order.editionId || this.liveEditionId();

    try {
      if (markDelivered) {
        const name = this.deliveryDeliveredBy().trim() || 'Staff';
        const dateVal = this.deliveryDeliveredAt() ? new Date(this.deliveryDeliveredAt()) : new Date();

        await this.tshirtService.updateDelivered(order.id, true, targetEdition, {
          deliveredBy: name,
          deliveredAt: dateVal,
        });

        // Optimistic UI update
        this.orders.update((list) =>
          list.map((o) =>
            o.id === order.id
              ? { ...o, delivered: true, deliveredBy: name, deliveredAt: dateVal }
              : o
          )
        );
      } else {
        await this.tshirtService.updateDelivered(order.id, false, targetEdition);

        // Optimistic UI update
        this.orders.update((list) =>
          list.map((o) =>
            o.id === order.id
              ? { ...o, delivered: false, deliveredBy: null, deliveredAt: null }
              : o
          )
        );
      }
      this.deliveryModalOrder.set(null);
    } catch (err: any) {
      this.deliveryError.set(err?.message || "Erreur lors de l'enregistrement de la livraison.");
    } finally {
      this.isSubmittingDelivery.set(false);
    }
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    this.ordersSub?.unsubscribe();
  }
}
export default AdminTshirtOrders;
