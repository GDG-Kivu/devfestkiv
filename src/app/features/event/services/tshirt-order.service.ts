import { EnvironmentInjector, inject, Injectable, runInInjectionContext } from '@angular/core';
import {
  addDoc,
  collection,
  collectionData,
  doc,
  Firestore,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { AuthService } from '../../../core/auth/services/auth.service';

export interface TshirtOrderData {
  id?: string;
  uid?: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  commune: string;
  place: string;
  sizes: Record<'S' | 'M' | 'L' | 'XL' | 'XXL', number>;
  createdAt?: any;
  delivered?: boolean;
  deliveredAt?: any;
  deliveredBy?: string | null;
}

@Injectable({ providedIn: 'root' })
export class TshirtOrderService {
  private readonly firestore = inject(Firestore);
  private readonly auth = inject(AuthService);
  private readonly injector = inject(EnvironmentInjector);

  async submit(order: TshirtOrderData): Promise<void> {
    const user = await this.auth.ensureAnonymousOrAuthenticated();
    if (!user) {
      throw Object.assign(new Error('Anonymous sign-in unavailable'), {
        code: 'auth/anonymous-sign-in-failed',
      });
    }
    await runInInjectionContext(this.injector, () =>
      addDoc(collection(this.firestore, 'tshirtOrders'), {
        ...order,
        uid: user.uid,
        createdAt: serverTimestamp(),
      }),
    );
  }

  getOrders(): Observable<TshirtOrderData[]> {
    return runInInjectionContext(this.injector, () => {
      const ordersCol = collection(this.firestore, 'tshirtOrders');
      const ordersQuery = query(ordersCol, orderBy('createdAt', 'desc'));
      return collectionData(ordersQuery, { idField: 'id' }) as Observable<TshirtOrderData[]>;
    });
  }

  async updateDelivered(orderId: string, delivered: boolean): Promise<void> {
    const user = this.auth.user();
    await runInInjectionContext(this.injector, () => {
      const orderRef = doc(this.firestore, 'tshirtOrders', orderId);
      return updateDoc(orderRef, {
        delivered,
        deliveredAt: delivered ? serverTimestamp() : null,
        deliveredBy: delivered ? (user?.email || user?.displayName || 'staff') : null,
      });
    });
  }
}