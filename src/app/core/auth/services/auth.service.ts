import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import {
  Auth,
  authState,
  GoogleAuthProvider,
  signInAnonymously as firebaseSignInAnonymously,
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

  /**
   * Ensures the initial auth state is resolved.
   */
  async ensureAuthenticated(): Promise<User | null> {
    if (!this.browser) return null;
    await this.initializedPromise;
    return this.auth.currentUser;
  }

  /**
   * Returns current authenticated user or signs in anonymously in background.
   * If already signed in with Google or an existing session, preserves it without disturbance.
   */
  async ensureAnonymousOrAuthenticated(): Promise<User | null> {
    if (!this.browser) return null;
    await this.initializedPromise;
    if (this.auth.currentUser) {
      return this.auth.currentUser;
    }
    return this.signInAnonymously();
  }

  /**
   * Signs in anonymously in the background for frictionless participation.
   */
  async signInAnonymously(): Promise<User | null> {
    if (!this.browser) return null;
    try {
      const result = await firebaseSignInAnonymously(this.auth);
      return result.user;
    } catch (err) {
      console.error('Anonymous sign-in error:', err);
      return null;
    }
  }

  /**
   * Signs in with Google popup.
   */
  async signInWithGoogle(): Promise<User | null> {
    if (!this.browser) return null;
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(this.auth, provider);
    return result.user;
  }

  /**
   * Signs out the current user session.
   */
  async signOut(): Promise<void> {
    if (this.browser) {
      await firebaseSignOut(this.auth);
      this.user.set(null);
    }
  }
}

