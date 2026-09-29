import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import {
  Auth,
  authState,
  GoogleAuthProvider,
  linkWithPopup,
  signInAnonymously,
  signInWithPopup,
  signOut as firebaseSignOut,
  User,
} from '@angular/fire/auth';
import { firstValueFrom, take } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly auth = inject(Auth);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly browser = isPlatformBrowser(this.platformId);
  private readonly initializedPromise = this.browser
    ? firstValueFrom(authState(this.auth).pipe(take(1)))
    : Promise.resolve(null);

  readonly user = signal<User | null>(null);
  readonly initialized = signal(!this.browser);

  constructor() {
    if (this.browser) {
      authState(this.auth).subscribe((user) => {
        this.user.set(user);
        this.initialized.set(true);
      });
    }
  }

  async ensureAuthenticated(): Promise<User | null> {
    if (!this.browser) return null;
    await this.initializedPromise;
    if (this.auth.currentUser) return this.auth.currentUser;
    return (await signInAnonymously(this.auth)).user;
  }

  async signInWithGoogle(): Promise<User | null> {
    if (!this.browser) return null;
    const currentUser = await this.ensureAuthenticated();
    const provider = new GoogleAuthProvider();

    if (currentUser?.isAnonymous) {
      try {
        return (await linkWithPopup(currentUser, provider)).user;
      } catch (error: any) {
        if (error?.code !== 'auth/credential-already-in-use') throw error;
      }
    }

    return (await signInWithPopup(this.auth, provider)).user;
  }

  async signOut(): Promise<void> {
    if (this.browser) await firebaseSignOut(this.auth);
  }
}
