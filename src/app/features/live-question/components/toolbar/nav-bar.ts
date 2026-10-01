import { Component, ElementRef, inject, signal } from '@angular/core';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Auth } from '@angular/fire/auth';
import { EventConfigService } from '../../../event/services/event-config.service';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { RoleService } from '../../../../core/auth/services/role.service';

@Component({
  selector: 'app-nav-bar',
  imports: [RouterLink, RouterLinkActive, CommonModule],
  host: {
    '(document:click)': 'onDocumentClick($event)',
  },
  templateUrl: "nav-bar.html",
  styles: `
    @keyframes popIn {
      0% {
        opacity: 0;
        transform: scale(0.95) translateY(-6px);
      }
      100% {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }
    .animate-pop-in {
      animation: popIn 0.18s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
  `,
})
export class NavBar {
  private readonly auth = inject(Auth);
  readonly authService = inject(AuthService);
  readonly roles = inject(RoleService);
  readonly router = inject(Router);
  readonly elementRef = inject(ElementRef);
  readonly eventConfig = inject(EventConfigService);

  readonly isUserMenuOpen = signal(false);
  readonly photoLoadError = signal(false);
  readonly navigatingUrl = signal<string | null>(null);

  isNavigatingTo(targetPath: string): boolean {
    const current = this.navigatingUrl();
    if (!current) return false;
    if (targetPath === '/live_q') {
      return current === '/live_q' || current === '/live_q/' || current.startsWith('/live_q?');
    }
    return current === targetPath || current.startsWith(targetPath + '/') || current.startsWith(targetPath + '?');
  }

  constructor() {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.navigatingUrl.set(event.url);
      } else if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        this.navigatingUrl.set(null);
      }
    });
  }

  currentUser() {
    return this.auth.currentUser || this.authService.user();
  }

  onPhotoError(): void {
    this.photoLoadError.set(true);
  }

  userDisplayName(): string {
    const afUser = this.auth.currentUser;
    if (afUser?.displayName) return afUser.displayName;
    if (afUser?.providerData && afUser.providerData.length > 0) {
      for (const p of afUser.providerData) {
        if (p?.displayName) return p.displayName;
      }
    }
    const svcUser = this.authService.user();
    if (svcUser?.displayName) return svcUser.displayName;
    if (this.roles.profile()?.displayName) return this.roles.profile()!.displayName!;
    if (afUser?.isAnonymous || svcUser?.isAnonymous) return 'Participant Anonyme';
    if (afUser?.email) return afUser.email.split('@')[0];
    if (svcUser?.email) return svcUser.email.split('@')[0];
    return 'Utilisateur';
  }

  userPhotoURL(): string | null {
    const afUser = this.auth.currentUser;
    if (afUser?.photoURL) return afUser.photoURL;
    if (afUser?.providerData && afUser.providerData.length > 0) {
      for (const p of afUser.providerData) {
        if (p?.photoURL) return p.photoURL;
      }
    }
    const svcUser = this.authService.user();
    if (svcUser?.photoURL) return svcUser.photoURL;
    if (svcUser?.providerData && svcUser.providerData.length > 0) {
      for (const p of svcUser.providerData) {
        if (p?.photoURL) return p.photoURL;
      }
    }
    return this.roles.profile()?.photoURL || null;
  }

  toggleUserMenu(event: Event): void {
    event.stopPropagation();
    this.isUserMenuOpen.update((v) => !v);
  }

  closeUserMenu(): void {
    this.isUserMenuOpen.set(false);
  }

  onDocumentClick(event: MouseEvent): void {
    if (this.isUserMenuOpen()) {
      const clickedInside = this.elementRef.nativeElement.querySelector('.user-dropdown-container')?.contains(event.target as Node);
      if (!clickedInside) {
        this.closeUserMenu();
      }
    }
  }

  getInitials(name?: string | null): string {
    if (!name) return 'U';
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  async signIn(): Promise<void> {
    try {
      const user = await this.authService.signInWithGoogle();
      if (user) {
        const profile = await this.roles.ensureProfile(user);
        if (profile?.role === 'admin' && profile.disabled !== true) {
          await this.router.navigateByUrl('/live_q/admin');
        } else if (profile?.role === 'viewer' && profile.disabled !== true) {
          await this.router.navigateByUrl('/presenter');
        }
      }
    } catch {
      // Popup closed or cancelled
    }
  }

  async signOut(): Promise<void> {
    this.closeUserMenu();
    await this.authService.signOut();
    await this.router.navigateByUrl('/');
  }
}
