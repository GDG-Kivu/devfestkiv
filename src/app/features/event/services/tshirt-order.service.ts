import { EnvironmentInjector, inject, Injectable, runInInjectionContext } from '@angular/core';
import { addDoc, collection, Firestore, serverTimestamp } from '@angular/fire/firestore';
import { AuthService } from '../../../core/auth/services/auth.service';

export interface TshirtOrderData {
  name: string;
  email: string;
  phone: string;
  location: string;
  commune: string;
  place: string;
  sizes: Record<'S' | 'M' | 'L' | 'XL' | 'XXL', number>;
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
}