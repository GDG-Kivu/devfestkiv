import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ContactService } from '../../../features/event/services/contact.service';

@Component({
  selector: 'app-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <footer class="relative bg-[#1a1200] text-gray-200 overflow-hidden">
      <!-- Top decorative image -->
      <div class="w-full h-8 overflow-hidden">
        <img
          src="/assets/bottom.png"
          alt=""
          aria-hidden="true"
          class="w-full h-full object-cover"
        />
      </div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        <!-- Main Footer Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          <!-- Brand Column -->
          <div class="space-y-4">
            <div>
              <img
                src="/assets/dark-logo.png"
                alt="DevFest Kivu Logo"
                class="h-10 w-auto"
                width="120"
                height="40"
                loading="lazy"
              />
            </div>
            <p class="text-sm text-gray-300 leading-relaxed">
              Le plus grand événement technologique de la région des Grands Lacs. Rejoignez-nous
              pour découvrir les dernières innovations et tendances tech.
            </p>
          </div>

          <!-- Liens rapides -->
          <div class="space-y-4">
            <h3 class="text-sm font-bold text-gray-100 uppercase tracking-wide">Liens rapides</h3>
            <nav class="space-y-2.5" aria-label="Liens rapides">
              <a
                routerLink="/"
                class="block text-sm text-gray-300 hover:text-white font-medium transition-colors duration-200"
                >Accueil</a
              >
              <a
                routerLink="/agenda"
                class="block text-sm text-gray-300 hover:text-white font-medium transition-colors duration-200"
                >Programme</a
              >
              <a
                routerLink="/speakers"
                class="block text-sm text-gray-300 hover:text-white font-medium transition-colors duration-200"
                >Intervenants</a
              >
              <a
                routerLink="/sponsor"
                class="block text-sm text-gray-300 hover:text-white font-medium transition-colors duration-200"
                >Partenaires</a
              >
            </nav>
          </div>

          <!-- Ressources -->
          <div class="space-y-4">
            <h3 class="text-sm font-bold text-gray-100 uppercase tracking-wide">Ressources</h3>
            <nav class="space-y-2.5" aria-label="Ressources">
              <a
                routerLink="/qa"
                class="block text-sm text-gray-300 hover:text-white font-medium transition-colors duration-200"
                >Questions fréquentes</a
              >
              <a
                routerLink="/dp-generator"
                class="block text-sm text-gray-300 hover:text-white font-medium transition-colors duration-200"
                >Générateur de DP</a
              >
              <a
                href="https://developers.google.com/community-guidelines"
                target="_blank"
                rel="noopener noreferrer"
                class="block text-sm text-gray-300 hover:text-white font-medium transition-colors duration-200"
                >Code de conduite <span class="sr-only">(s'ouvre dans un nouvel onglet)</span></a
              >
              <a
                routerLink="/contact"
                class="block text-sm text-gray-300 hover:text-white font-medium transition-colors duration-200"
                >Contact & Support</a
              >
            </nav>
          </div>

          <!-- Suivez-nous + Newsletter -->
          <div class="space-y-4">
            <h3 class="text-sm font-bold text-gray-100 uppercase tracking-wide">Suivez-nous</h3>

            <div class="flex gap-2.5" role="group" aria-label="Réseaux sociaux">
              <a
                href="https://twitter.com/devfestkivu"
                target="_blank"
                rel="noopener noreferrer"
                class="w-9 h-9 bg-amber-400 text-gray-950 hover:bg-amber-300 rounded-full flex items-center justify-center transition-colors shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                aria-label="DevFest Kivu sur X (Twitter), s'ouvre dans un nouvel onglet"
              >
                <svg
                  class="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path
                    d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
                  />
                </svg>
              </a>
              <a
                href="https://facebook.com/devfestkivu"
                target="_blank"
                rel="noopener noreferrer"
                class="w-9 h-9 bg-amber-400 text-gray-950 hover:bg-amber-300 rounded-full flex items-center justify-center transition-colors shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                aria-label="DevFest Kivu sur Facebook, s'ouvre dans un nouvel onglet"
              >
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                  />
                </svg>
              </a>
              <a
                href="https://linkedin.com/company/devfestkivu"
                target="_blank"
                rel="noopener noreferrer"
                class="w-9 h-9 bg-amber-400 text-gray-950 hover:bg-amber-300 rounded-full flex items-center justify-center transition-colors shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                aria-label="DevFest Kivu sur LinkedIn, s'ouvre dans un nouvel onglet"
              >
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
                  />
                </svg>
              </a>
              <a
                href="https://youtube.com/@devfestkivu"
                target="_blank"
                rel="noopener noreferrer"
                class="w-9 h-9 bg-amber-400 text-gray-950 hover:bg-amber-300 rounded-full flex items-center justify-center transition-colors shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                aria-label="DevFest Kivu sur YouTube, s'ouvre dans un nouvel onglet"
              >
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"
                  />
                </svg>
              </a>
            </div>

            <!-- Newsletter -->
            <div class="space-y-2 pt-1">
              <p class="text-xs font-bold text-gray-200">Restez informé des actualités :</p>
              <form
                (ngSubmit)="subscribeNewsletter()"
                class="flex"
                aria-label="Inscription à la newsletter"
              >
                <input
                  type="email"
                  required
                  autocomplete="email"
                  aria-label="Votre adresse email pour la newsletter"
                  [(ngModel)]="newsletterEmail"
                  name="newsletterEmail"
                  placeholder="Votre adresse email"
                  class="flex-1 px-3 py-2 text-xs text-gray-900 placeholder:text-gray-500 bg-white rounded-l-lg focus:outline-none focus:ring-2 focus:ring-amber-200 border border-gray-300 border-r-0 min-w-0"
                />
                <button
                  type="submit"
                  [disabled]="isSubscribing() || !newsletterEmail.trim()"
                  [attr.aria-busy]="isSubscribing()"
                  [attr.aria-label]="isSubscribing() ? 'Inscription en cours' : null"
                  class="px-3 py-2 bg-gray-900 text-white text-xs font-bold rounded-r-lg cursor-pointer hover:bg-gray-700 disabled:opacity-50 whitespace-nowrap transition-colors flex-shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
                >
                  @if (isSubscribing()) {
                    <svg
                      class="w-4 h-4 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                      focusable="false"
                    >
                      <circle
                        class="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        stroke-width="4"
                      ></circle>
                      <path
                        class="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  } @else {
                    <span>S'abonner</span>
                  }
                </button>
              </form>
              <p
                class="text-xs pt-0.5 min-h-4"
                role="status"
                aria-live="polite"
                [class.text-emerald-300]="feedbackType() === 'success'"
                [class.text-rose-300]="feedbackType() === 'error'"
              >
                {{ newsletterFeedback() }}
              </p>
            </div>
          </div>
        </div>

        <!-- Copyright -->
        <div class="border-t border-white/10 mt-10 pt-6 text-center">
          <p class="text-xs text-gray-400">
            © {{ currentYear }} DevFest Kivu. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  `,
  styles: ``,
})
export class Footer {
  private contactService = inject(ContactService);
  currentYear = new Date().getFullYear();

  newsletterEmail = '';
  isSubscribing = signal(false);
  newsletterFeedback = signal<string | null>(null);
  feedbackType = signal<'success' | 'error'>('success');

  async subscribeNewsletter(): Promise<void> {
    const email = this.newsletterEmail.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      this.feedbackType.set('error');
      this.newsletterFeedback.set('Veuillez saisir une adresse email valide.');
      return;
    }

    this.isSubscribing.set(true);
    this.newsletterFeedback.set(null);

    try {
      await this.contactService.subscribeNewsletter(email);
      this.feedbackType.set('success');
      this.newsletterFeedback.set('Merci ! Votre inscription a bien été prise en compte.');
      this.newsletterEmail = '';
    } catch (err: any) {
      console.error('Erreur inscription newsletter:', err);
      this.feedbackType.set('error');
      this.newsletterFeedback.set('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      this.isSubscribing.set(false);
    }
  }
}
