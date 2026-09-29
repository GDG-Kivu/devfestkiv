import { effect, inject, Injectable, signal } from '@angular/core';
import { doc, Firestore, getDoc } from '@angular/fire/firestore';
import { User } from '@angular/fire/auth';
import { AuthService } from './auth.service';
import { firestorePaths } from '../firestore/firestore-paths';
import { UserProfile } from './models/user-profile.model';

@Injectable({ providedIn: 'root' })
export class RoleService {
  private readonly firestore = inject(Firestore);
  private readonly auth = inject(AuthService);
  readonly profile = signal<UserProfile | null>(null);
  readonly isAdmin = signal(false);

  constructor() {
    effect(() => {
      const user = this.auth.user();
      if (user) {
        void this.ensureProfile(user);
      } else {
        this.profile.set(null);
        this.isAdmin.set(false);
      }
    });
  }

  async ensureProfile(user: User): Promise<UserProfile | null> {
    try {
      const snapshot = await getDoc(doc(this.firestore, firestorePaths.user(user.uid)));
      const profile = snapshot.exists()
        ? ({ uid: user.uid, ...snapshot.data() } as UserProfile)
        : null;
      if (this.auth.user()?.uid !== user.uid) return null;
      this.profile.set(profile);
      this.isAdmin.set(profile?.role === 'admin' && profile.disabled !== true);
      return profile;
    } catch {
      this.profile.set(null);
      this.isAdmin.set(false);
      return null;
    }
  }

  async isCurrentUserAdmin(user: User | null): Promise<boolean> {
    if (!user) {
      this.profile.set(null);
      this.isAdmin.set(false);
      return false;
    }
    await this.ensureProfile(user);
    return this.isAdmin();
  }
}
