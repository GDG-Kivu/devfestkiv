import { afterNextRender, ChangeDetectionStrategy, Component, inject, OnDestroy, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  host: {
    class: 'sticky top-0 z-50 block w-full',
  },
  template: `
    <nav
      class="bg-white/95 border-b border-gray-100 transition-colors duration-200" aria-label="Navigation principale">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <!-- Logo Section -->
          <div class="flex-shrink-0 flex items-center">
            <a routerLink="/" class="flex items-center space-x-3" aria-label="DevFest Kivu, retour à l'accueil">
              <img
                src="/assets/logo-1.png"
                alt="DevFest Kivu Logo"
                class="h-8 w-auto sm:h-10 lg:h-10"
                width="139"
                height="40"
              />
            </a>
          </div>

          <!-- Desktop Navigation -->
          <div class="hidden lg:block">
            <div class="ml-6 xl:ml-10 flex items-baseline space-x-1 xl:space-x-2 group">
              @for (item of navItems(); track item.path) {
                <a
                  [routerLink]="item.path"
                  routerLinkActive="nav-active"
                  ariaCurrentWhenActive="page"
                  [routerLinkActiveOptions]="item.path === '/' ? { exact: true } : { exact: false }"
                  class="nav-link text-sm xl:text-base text-gray-500"
                >
                  {{ item.label }}
                </a>
              }
            </div>
          </div>

          <!-- CTA Button (Desktop) -->
          <div class="hidden lg:block">
            <a routerLink="/dp-generator" class="btn btn-primary btn-md"> Genérer votre DP </a>
          </div>

          <!-- Mobile Menu Button -->
          <div class="lg:hidden">
            <button
              (click)="toggleMobileMenu()"
              class="relative inline-flex items-center justify-center p-sm text-text hover:text-primary-dark hover:bg-background/50 transition-all duration-300 rounded-sm group"
              [attr.aria-expanded]="isMobileMenuOpen()"
              aria-controls="mobile-menu"
              [attr.aria-label]="
              isMobileMenuOpen() ? 'Fermer le menu de navigation' : 'Ouvrir le menu de navigation'
              "
            >
              <div class="relative w-6 h-6" aria-hidden="true">
                <svg
                  class="absolute inset-0 w-6 h-6 transition-all duration-300"
                  [class.opacity-0]="isMobileMenuOpen()"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
                <svg
                  class="absolute inset-0 w-6 h-6 transition-all duration-300"
                  [class.opacity-0]="!isMobileMenuOpen()"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
            </button>
          </div>
        </div>
      </div>

      <!-- Mobile Navigation Menu — full-screen overlay (covers 100% of the viewport) -->
      @if (isReady() && isMobileMenuOpen()) {
      <div
        id="mobile-menu"
        class="lg:hidden fixed inset-0 z-[100] bg-white flex flex-col h-[100dvh] w-full"
        role="dialog"
        aria-modal="true"
        aria-label="Menu de navigation"
      >
        <!-- Overlay Header with logo and close button -->
        <div class="flex items-center justify-between h-16 px-4 sm:px-6 border-b border-gray-100 flex-shrink-0 bg-white">
          <a routerLink="/" (click)="closeMobileMenu()" class="flex items-center space-x-3" aria-label="DevFest Kivu, retour à l'accueil">
            <img
              src="/assets/logo-1.png"
              alt="DevFest Kivu Logo"
              class="h-8 w-auto sm:h-10"
              width="139"
              height="40"
            />
          </a>
          <button
            type="button"
            (click)="closeMobileMenu()"
            class="inline-flex items-center justify-center p-2 rounded-xl text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="Fermer le menu"
          >
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Links with animated arrow on hover and active -->
        <nav class="flex-1 overflow-y-auto overscroll-contain px-4 py-5 space-y-2">
          @for (item of navItems(); track item.path; let i = $index) {
            <a
              [routerLink]="item.path"
              routerLinkActive="nav-active-mobile"
              ariaCurrentWhenActive="page"
              [routerLinkActiveOptions]="item.path === '/' ? { exact: true } : { exact: false }"
              (click)="closeMobileMenu()"
              class="nav-mobile-link"
              [style.animationDelay]="i * 35 + 'ms'"
            >
              <span>{{ item.label }}</span>
              <svg
                class="nav-arrow w-5 h-5 transition-transform duration-200"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25" />
              </svg>
            </a>
          }
        </nav>

        <!-- CTA -->
        <div class="px-4 py-5 border-t border-gray-100 bg-gray-50/50 flex-shrink-0">
          <a
            routerLink="/dp-generator"
            (click)="closeMobileMenu()"
            class="btn btn-primary btn-md w-full text-center block shadow-sm py-3 rounded-xl font-semibold"
          >
            Générer votre DP
          </a>
        </div>
      </div>
      }
    </nav>
  `,
  styles: [
    `
      /* Navigation Links */
      .nav-link {
        position: relative;
        padding: var(--spacing-sm);
        font-size: 0.875rem;
        font-weight: 500;
        text-decoration: none;
        transition: all 0.3s ease-in-out;
      }

      .nav-link::after {
        content: '';
        position: absolute;
        bottom: -2px;
        left: 50%;
        width: 0;
        height: 2px;
        background-color: var(--color-primary);
        transition: all 0.3s ease-in-out;
        transform: translateX(-50%);
      }

      .nav-link:hover {
        color: var(--color-primary-dark, #d99500);
      }

      .nav-link:hover::after {
        width: 100%;
      }

      .nav-link.nav-active {
        color: var(--color-primary-dark, #d99500);
        font-weight: 600;
      }

      .nav-link.nav-active::after {
        width: 100%;
      }

      .nav-link:focus-visible {
        outline: 2px solid #b45309;
        outline-offset: 2px;
        border-radius: 4px;
      }

      /* Hide active line when hovering other links */
      .group:hover .nav-link.nav-active:not(:hover)::after {
        width: 0;
      }

      /* Mobile active state and link styles */
      .nav-mobile-link {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1rem 0.75rem;
        font-size: 1.125rem;
        font-weight: 500;
        color: #374151;
        text-decoration: none;
        transition: color 0.2s ease;
        animation: slideInRight 0.2s ease both;
        border-bottom: 1px solid #f3f4f6;
      }

      .nav-mobile-link .nav-arrow {
        color: #9ca3af;
        transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), color 0.2s ease;
      }

      .nav-mobile-link:hover {
        color: var(--color-primary-dark, #d99500);
      }

      .nav-mobile-link:hover .nav-arrow {
        transform: translate(5px, -3px);
        color: var(--color-primary-dark, #d99500);
      }

      .nav-mobile-link.nav-active-mobile {
        color: var(--color-primary-dark, #d99500) !important;
        font-weight: 600 !important;
      }

      .nav-mobile-link.nav-active-mobile .nav-arrow {
        color: var(--color-primary-dark, #d99500) !important;
      }

      .nav-mobile-link.nav-active-mobile:hover .nav-arrow {
        transform: translate(5px, -3px);
      }

      @keyframes slideInRight {
        from {
          opacity: 0;
          transform: translateX(-10px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
    `,
  ],
})
export class Navbar implements OnDestroy {
  private readonly document = inject(DOCUMENT);
  isMobileMenuOpen = signal(false);
  /** Stays false during SSR and the hydration flash window; set true after first browser render. */
  isReady = signal(false);

  navItems = signal([
    { path: '/', label: 'Home' },
    { path: '/agenda', label: 'Agenda' },
    { path: '/speakers', label: 'Speakers' },
    { path: '/sponsor', label: 'Sponsors' },
    { path: '/qa', label: 'Q&A' },
    { path: '/live_q', label: 'Questions live' },
  ]);

  constructor() {
    afterNextRender(() => {
      this.isReady.set(true);
    });
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen.update((value) => {
      const next = !value;
      this.setScrollLocked(next);
      return next;
    });
  }

  closeMobileMenu() {
    this.isMobileMenuOpen.set(false);
    this.setScrollLocked(false);
  }

  private setScrollLocked(locked: boolean) {
    if (!this.document) return;
    const docEl = this.document.documentElement;
    const body = this.document.body;
    if (locked) {
      docEl.style.overflow = 'hidden';
      body.style.overflow = 'hidden';
    } else {
      docEl.style.overflow = '';
      body.style.overflow = '';
    }
  }

  ngOnDestroy(): void {
    this.setScrollLocked(false);
  }
}
