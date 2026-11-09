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
  writeBatch,
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
  contacted?: boolean;
  contactedAt?: Timestamp | Date | null;
  assignedToEmail?: string | null;
  assignedToName?: string | null;
  editionId?: string;
}

export interface DeliveryDetails {
  deliveredBy?: string | null;
  deliveredAt?: Date | string | Timestamp | null;
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
      throw Object.assign(new Error('Authentification indisponible'), {
        code: 'auth/anonymous-sign-in-failed',
      });
    }

    const targetEdition = editionId !== undefined
      ? String(editionId)
      : await firstValueFrom(this.fsService.getCurrentEditionId());

    return runInInjectionContext(this.injector, () =>
      addDoc(collection(this.firestore, firestorePaths.eventTshirtOrders(targetEdition)), {
        ...order,
        editionId: targetEdition,
        uid: user.uid,
        createdAt: serverTimestamp(),
      }).then(() => {}),
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

  updateDelivered(
    orderId: string,
    delivered: boolean,
    editionId: string | number,
    details?: DeliveryDetails,
  ): Promise<void> {
    const targetEdition = String(editionId);
    const user = this.auth.user();
    const orderRef = doc(this.firestore, firestorePaths.eventTshirtOrder(targetEdition, orderId));

    const deliveredAt = delivered
      ? (details?.deliveredAt
          ? (details.deliveredAt instanceof Timestamp
              ? details.deliveredAt
              : Timestamp.fromDate(new Date(details.deliveredAt)))
          : serverTimestamp())
      : null;

    const deliveredBy = delivered
      ? (details?.deliveredBy?.trim() || user?.displayName || user?.email || 'Staff')
      : null;

    return updateDoc(orderRef, { delivered, deliveredAt, deliveredBy });
  }

  updateContacted(orderId: string, editionId: string, contacted: boolean): Promise<void> {
    const orderRef = doc(this.firestore, firestorePaths.eventTshirtOrder(editionId, orderId));
    return updateDoc(orderRef, {
      contacted,
      contactedAt: contacted ? serverTimestamp() : null,
    });
  }

  assignOrders(
    orderIds: string[],
    editionId: string,
    assignee: { email: string; name: string } | null,
  ): Promise<void> {
    if (!orderIds.length || orderIds.length > 500) {
      return Promise.reject(new Error('Sélectionnez entre 1 et 500 commandes.'));
    }
    const batch = writeBatch(this.firestore);
    for (const id of orderIds) {
      batch.update(doc(this.firestore, firestorePaths.eventTshirtOrder(editionId, id)), {
        assignedToEmail: assignee?.email ?? null,
        assignedToName: assignee?.name ?? null,
      });
    }
    return batch.commit();
  }
}
