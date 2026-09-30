import { Component, ElementRef, HostListener, inject, signal } from '@angular/core';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Auth } from '@angular/fire/auth';
import { EventConfigService } from '../../../event/services/event-config.service';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { RoleService } from '../../../../core/auth/services/role.service';

@Component({
  selector: 'app-nav-bar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  template: `
    <header class="bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-xs border-b border-gray-100 transition-all duration-300">
      <div class="container mx-auto px-4 py-3 max-w-7xl">
        <div class="flex items-center justify-between">
          <!-- Logo Section -->
          <div class="flex-shrink-0 flex items-center">
            <a routerLink="/" class="flex items-center space-x-3 transition-opacity hover:opacity-90">
              <img
                src="/assets/logo-1.png"
                alt="DevFest Kivu Logo"
                class="h-8 w-auto sm:h-10 lg:h-10"
              />
            </a>
          </div>

          <!-- Center info & Actions -->
          <div class="flex items-center gap-3 sm:gap-4">
            <div class="hidden sm:flex items-center gap-4 text-xs lg:text-sm text-gray-500 font-medium">
              <div class="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-100">
                <!-- Calendar Icon -->
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.8"
                  stroke="currentColor"
                  class="w-4 h-4 text-[#4285F4]"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
                  />
                </svg>
                <span>{{ eventConfig.date.display.month }} {{ eventConfig.date.display.year }}</span>
              </div>

              <div class="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-100">
                <!-- Map Pin Icon -->
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.8"
                  stroke="currentColor"
                  class="w-4 h-4 text-[#EA4335]"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
                  />
                </svg>
                <span>Bukavu, RDC</span>
              </div>
            </div>

            <!-- Navigation Shortcuts with active link highlight and in-place loading -->
            @if (roles.isLoadingProfile()) {
              <div class="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100/80 rounded-lg border border-gray-200 animate-pulse text-xs text-gray-500 font-medium">
                <svg class="w-3.5 h-3.5 animate-spin text-[#4285F4]" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span class="hidden sm:inline">Chargement...</span>
              </div>
            } @else {
              @if (roles.isPresenterOrAdmin()) {
                <a
                  routerLink="/live_q"
                  routerLinkActive="!border-[#34A853] !text-[#34A853] !bg-emerald-50/80 shadow-xs"
                  [routerLinkActiveOptions]="{ exact: true }"
                  class="flex items-center gap-1.5 border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 bg-white rounded-lg px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium transition cursor-pointer"
                >
                  @if (navigatingUrl() === '/live_q') {
                    <svg class="w-4 h-4 animate-spin text-[#34A853]" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  } @else {
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke-width="1.8"
                      stroke="currentColor"
                      class="w-4 h-4 text-current"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
                      />
                    </svg>
                  }
                  <span class="hidden sm:inline">Accueil</span>
                </a>

                <a
                  routerLink="/presenter"
                  routerLinkActive="!border-[#4285F4] !text-[#4285F4] !bg-blue-50/80 shadow-xs"
                  class="flex items-center gap-1.5 border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 bg-white rounded-lg px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium transition cursor-pointer"
                >
                  @if (navigatingUrl() === '/presenter') {
                    <svg class="w-4 h-4 animate-spin text-[#4285F4]" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  } @else {
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke-width="1.8"
                      stroke="currentColor"
                      class="w-4 h-4 text-current"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5m.75-9 3-3 2.148 2.148A12.061 12.061 0 0 1 16.5 7.605"
                      />
                    </svg>
                  }
                  <span class="hidden sm:inline">Présenter</span>
                </a>
              }

              @if (roles.isAdmin()) {
                <a
                  routerLink="/live_q/admin"
                  routerLinkActive="!border-[#EA4335] !text-[#EA4335] !bg-red-50/80 shadow-xs"
                  class="flex items-center gap-1.5 border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 bg-white rounded-lg px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium transition cursor-pointer"
                >
                  @if (navigatingUrl() === '/live_q/admin') {
                    <svg class="w-4 h-4 animate-spin text-[#EA4335]" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  } @else {
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke-width="1.8"
                      stroke="currentColor"
                      class="w-4 h-4 text-current"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 0 1 1.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.559.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.894.149c-.424.07-.764.383-.929.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 0 1-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.398.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 0 1-.12-1.45l.527-.737c.25-.35.272-.806.108-1.204-.165-.397-.506-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 0 1 .12-1.45l.773-.773a1.125 1.125 0 0 1 1.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894Z"
                      />
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                      />
                    </svg>
                  }
                  <span class="hidden sm:inline">Admin</span>
                </a>
              }
            }

            <!-- Auth Profile Section -->
            @if (currentUser(); as user) {
              <!-- User Profile Dropdown -->
              <div class="relative user-dropdown-container">
                <!-- Avatar Button -->
                <div class="relative group/tooltip">
                  <button
                    type="button"
                    (click)="toggleUserMenu($event)"
                    class="relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 border-[#4285F4]/40 hover:border-[#4285F4] shadow-xs transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#4285F4]/40 cursor-pointer overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100"
                    [attr.aria-expanded]="isUserMenuOpen()"
                    aria-label="Menu utilisateur"
                  >
                    @if (userPhotoURL() && !photoLoadError()) {
                      <img
                        [src]="userPhotoURL()"
                        [alt]="userDisplayName()"
                        (error)="onPhotoError()"
                        class="w-full h-full object-cover rounded-full"
                        referrerpolicy="no-referrer"
                      />
                    } @else {
                      <span class="font-bold text-xs sm:text-sm text-[#4285F4] select-none">
                        {{ getInitials(userDisplayName()) }}
                      </span>
                    }
                  </button>

                  <!-- Tooltip with Display Name on Hover -->
                  @if (!isUserMenuOpen()) {
                    <div
                      class="absolute right-0 top-full mt-2 hidden group-hover/tooltip:flex flex-col items-center pointer-events-none z-50 transition-opacity duration-200 opacity-0 group-hover/tooltip:opacity-100"
                    >
                      <div class="bg-gray-900 text-white text-xs font-medium px-2.5 py-1 rounded-md shadow-lg whitespace-nowrap">
                        {{ userDisplayName() }}
                      </div>
                    </div>
                  }
                </div>

                <!-- Clean Dropdown Menu on Click (No redundant photo) -->
                @if (isUserMenuOpen()) {
                  <div
                    class="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 animate-pop-in"
                    (click)="$event.stopPropagation()"
                  >
                    <!-- User Header -->
                    <div class="px-4 py-3 border-b border-gray-100">
                      <div class="min-w-0">
                        <p class="text-sm font-bold text-gray-900 truncate">
                          {{ userDisplayName() }}
                        </p>
                        @if (user.email) {
                          <p class="text-[11px] text-gray-500 font-mono truncate mt-0.5">
                            {{ user.email }}
                          </p>
                        }
                        @if (roles.isLoadingProfile()) {
                          <span class="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 text-[10px] font-medium text-gray-600 bg-gray-100 rounded-full animate-pulse">
                            <span class="w-1.5 h-1.5 rounded-full bg-gray-400 animate-ping"></span>
                            Chargement...
                          </span>
                        } @else if (roles.isAdmin()) {
                          <span class="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 text-[10px] font-bold text-[#EA4335] bg-[#EA4335]/10 rounded-full">
                            <span class="w-1.5 h-1.5 rounded-full bg-[#EA4335]"></span>
                            Administrateur
                          </span>
                        } @else if (roles.isViewer()) {
                          <span class="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 text-[10px] font-bold text-[#4285F4] bg-[#4285F4]/10 rounded-full">
                            <span class="w-1.5 h-1.5 rounded-full bg-[#4285F4]"></span>
                            Présentateur
                          </span>
                        } @else {
                          <span class="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 text-[10px] font-medium text-gray-600 bg-gray-100 rounded-full">
                            {{ user.isAnonymous ? 'Participant (Anonyme)' : 'Participant' }}
                          </span>
                        }
                      </div>
                    </div>

                    <!-- Connect with Google if currently anonymous -->
                    @if (user.isAnonymous) {
                      <div class="p-2 border-b border-gray-100">
                        <button
                          type="button"
                          (click)="signIn()"
                          class="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-[#4285F4] hover:bg-blue-100 rounded-xl text-xs font-semibold transition cursor-pointer"
                        >
                          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                          </svg>
                          <span>Connexion compte Google</span>
                        </button>
                      </div>
                    }

                    <!-- Sign Out Option -->
                    <div class="pt-1">
                      <button
                        type="button"
                        (click)="signOut()"
                        class="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition text-left cursor-pointer"
                      >
                        <svg class="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                        </svg>
                        <span>Se déconnecter</span>
                      </button>
                    </div>
                  </div>
                }
              </div>
            } @else {
              <!-- Unauthenticated: Google Sign-In button -->
              <button
                type="button"
                (click)="signIn()"
                class="flex items-center gap-2 px-3 sm:px-4 py-1.5 bg-white text-gray-700 hover:text-gray-900 border border-gray-300 hover:border-gray-400 rounded-full text-xs sm:text-sm font-medium shadow-2xs hover:shadow-xs transition duration-200 cursor-pointer"
              >
                <svg class="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Se connecter avec Google</span>
              </button>
            }
          </div>
        </div>
      </div>
    </header>
  `,
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

  @HostListener('document:click', ['$event'])
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
