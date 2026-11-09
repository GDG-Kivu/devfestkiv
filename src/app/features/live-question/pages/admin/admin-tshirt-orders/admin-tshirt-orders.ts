import { ChangeDetectionStrategy, Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { TshirtOrderData, TshirtOrderService } from '../../../../event/services/tshirt-order.service';

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
  `,
})
export class AdminTshirtOrders implements OnInit, OnDestroy {
  private readonly tshirtService = inject(TshirtOrderService);

  readonly availableSizes: Array<'S' | 'M' | 'L' | 'XL' | 'XXL'> = ['S', 'M', 'L', 'XL', 'XXL'];

  orders = signal<TshirtOrderData[]>([]);
  isLoading = signal(true);
  searchQuery = signal('');
  statusFilter = signal<'all' | 'delivered' | 'pending'>('all');
  locationFilter = signal<'all' | 'event' | 'bukavu'>('all');

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
        return nameMatch || emailMatch || phoneMatch || communeMatch || placeMatch;
      }

      return true;
    });
  });

  ngOnInit(): void {
    this.isLoading.set(true);
    this.ordersSub = this.tshirtService.getOrders().subscribe({
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

  async toggleDelivered(order: TshirtOrderData): Promise<void> {
    if (!order.id) return;
    const newStatus = !(order.delivered === true);
    // Optimistic UI update
    this.orders.update((list) =>
      list.map((o) => (o.id === order.id ? { ...o, delivered: newStatus } : o))
    );
    try {
      await this.tshirtService.updateDelivered(order.id, newStatus);
    } catch {
      // Revert on error
      this.orders.update((list) =>
        list.map((o) => (o.id === order.id ? { ...o, delivered: !newStatus } : o))
      );
    }
  }

  ngOnDestroy(): void {
    this.ordersSub?.unsubscribe();
  }
}
export default AdminTshirtOrders;
