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
  Timestamp,
  updateDoc,
} from '@angular/fire/firestore';
import { firstValueFrom, Observable, of, switchMap } from 'rxjs';
import { AuthService } from '../../../core/auth/services/auth.service';
import { FirestoreService } from '../../../core/firestore/firestore.service';
import { firestorePaths } from '../../../core/firestore/firestore-paths';

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
  editionId?: string;
}

export interface DeliveryDetails {
  deliveredBy?: string | null;
  deliveredAt?: any;
}

@Injectable({ providedIn: 'root' })
export class TshirtOrderService {
  private readonly firestore = inject(Firestore);
  private readonly auth = inject(AuthService);
  private readonly injector = inject(EnvironmentInjector);
  private readonly fsService = inject(FirestoreService);

  async submit(order: TshirtOrderData, editionId?: string | number): Promise<void> {
    const user = await this.auth.ensureAnonymousOrAuthenticated();
    if (!user) {
      throw Object.assign(new Error('Anonymous sign-in unavailable'), {
        code: 'auth/anonymous-sign-in-failed',
      });
    }

    const targetEdition = editionId !== undefined
      ? String(editionId)
      : await firstValueFrom(this.fsService.getCurrentEditionId());

    await runInInjectionContext(this.injector, () =>
      addDoc(collection(this.firestore, firestorePaths.eventTshirtOrders(targetEdition)), {
        ...order,
        editionId: targetEdition,
        uid: user.uid,
        createdAt: serverTimestamp(),
      }),
    );
  }

  getOrders(editionId?: string | number): Observable<TshirtOrderData[]> {
    const edition$ = editionId !== undefined
      ? of(String(editionId))
      : this.fsService.getCurrentEditionId();

    return edition$.pipe(
      switchMap((id) =>
        runInInjectionContext(this.injector, () => {
          const ordersCol = collection(this.firestore, firestorePaths.eventTshirtOrders(id));
          const ordersQuery = query(ordersCol, orderBy('createdAt', 'desc'));
          return collectionData(ordersQuery, { idField: 'id' }) as Observable<TshirtOrderData[]>;
        }),
      ),
    );
  }

  async updateDelivered(
    orderId: string,
    delivered: boolean,
    editionId?: string | number,
    deliveryDetails?: DeliveryDetails,
  ): Promise<void> {
    const user = this.auth.user();
    const targetEdition = editionId !== undefined
      ? String(editionId)
      : await firstValueFrom(this.fsService.getCurrentEditionId());

    await runInInjectionContext(this.injector, () => {
      const orderRef = doc(this.firestore, firestorePaths.eventTshirtOrder(targetEdition, orderId));

      let deliveredAtVal: any = null;
      if (delivered) {
        if (deliveryDetails?.deliveredAt) {
          deliveredAtVal = deliveryDetails.deliveredAt instanceof Timestamp
            ? deliveryDetails.deliveredAt
            : (deliveryDetails.deliveredAt instanceof Date
                ? Timestamp.fromDate(deliveryDetails.deliveredAt)
                : Timestamp.fromDate(new Date(deliveryDetails.deliveredAt)));
        } else {
          deliveredAtVal = serverTimestamp();
        }
      }

      const deliveredByVal = delivered
        ? (deliveryDetails?.deliveredBy?.trim() || user?.displayName || user?.email || 'staff')
        : null;

      return updateDoc(orderRef, {
        delivered,
        deliveredAt: deliveredAtVal,
        deliveredBy: deliveredByVal,
      });
    });
  }
}