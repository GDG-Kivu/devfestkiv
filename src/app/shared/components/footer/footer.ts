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
    <footer class="bg-accent-pastel">
      <div class="max-w-7xl mx-auto px-md sm:px-lg lg:px-xl py-xl">
        <!-- Main Footer Content -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-lg">
          
          <!-- About Section -->
          <div class="space-y-md">
            <div class="flex items-center space-x-3">
              <img 
                src="/assets/logo-1.png" 
                alt="DevFest Kivu Logo" 
                class="h-8 w-auto"
                width="111"
                height="32"
                loading="lazy"
              >
            </div>
            <p class="text-sm leading-relaxed">
              Le plus grand événement technologique de la région des Grands Lacs. 
              Rejoignez-nous pour découvrir les dernières innovations et tendances tech.
            </p>
          </div>

          <!-- Quick Links -->
          <div class="space-y-md">
            <h3 class="text-lg font-semibold">Liens rapides</h3>
            <nav class="space-y-sm">
              <a routerLink="/" class="block text-sm transition-all duration-200 hover:text-primary hover:underline underline-offset-2">
                Accueil
              </a>
              <a routerLink="/agenda" class="block text-sm transition-all duration-200 hover:text-primary hover:underline underline-offset-2">
                Programme
              </a>
              <a routerLink="/speakers" class="block text-sm transition-all duration-200 hover:text-primary hover:underline underline-offset-2">
                Intervenants
              </a>
              <a routerLink="/sponsor" class="block text-sm transition-all duration-200 hover:text-primary hover:underline underline-offset-2">
                Partenaires
              </a>
            </nav>
          </div>

          <!-- Resources -->
          <div class="space-y-md">
            <h3 class="text-lg font-semibold">Ressources</h3>
            <nav class="space-y-sm">
              <a routerLink="/qa" class="block text-sm transition-all duration-200 hover:text-primary hover:underline underline-offset-2">
                Questions fréquentes
              </a>
              <a routerLink="/dp-generator" class="block text-sm transition-all duration-200 hover:text-primary hover:underline underline-offset-2">
                Générateur de DP
              </a>
              <a 
                href="https://developers.google.com/community-guidelines" 
                target="_blank" 
                rel="noopener noreferrer" 
                class="block text-sm transition-all duration-200 hover:text-primary hover:underline underline-offset-2"
              >
                Code de conduite
              </a>
              <a routerLink="/contact" class="block text-sm transition-all duration-200 hover:text-primary hover:underline underline-offset-2">
                Contact & Support
              </a>
            </nav>
          </div>

          <!-- Social Media & Newsletter -->
          <div class="space-y-md">
            <h3 class="text-lg font-semibold">Suivez-nous</h3>
            <div class="flex flex-wrap gap-md">
              <a 
                href="https://twitter.com/devfestkivu" 
                target="_blank" 
                rel="noopener noreferrer"
                class="flex items-center justify-center w-10 h-10 bg-text/20 hover:bg-primary hover:text-white rounded-md transition-all duration-200 hover:scale-110 hover:shadow-md"
                aria-label="Twitter"
              >
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>

              <a 
                href="https://facebook.com/devfestkivu" 
                target="_blank" 
                rel="noopener noreferrer"
                class="flex items-center justify-center w-10 h-10 bg-text/20 hover:bg-primary hover:text-white rounded-md transition-all duration-200 hover:scale-110 hover:shadow-md"
                aria-label="Facebook"
              >
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>

              <a 
                href="https://linkedin.com/company/devfestkivu" 
                target="_blank" 
                rel="noopener noreferrer"
                class="flex items-center justify-center w-10 h-10 bg-text/20 hover:bg-primary hover:text-white rounded-md transition-all duration-200 hover:scale-110 hover:shadow-md"
                aria-label="LinkedIn"
              >
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>

              <a 
                href="https://youtube.com/@devfestkivu" 
                target="_blank" 
                rel="noopener noreferrer"
                class="flex items-center justify-center w-10 h-10 bg-text/20 hover:bg-primary hover:text-white rounded-md transition-all duration-200 hover:scale-110 hover:shadow-md"
                aria-label="YouTube"
              >
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
            </div>
            
            <!-- Newsletter Signup -->
            <div class="mt-md space-y-2">
              <p class="text-sm font-semibold">Restez informé des actualités</p>
              <form (ngSubmit)="subscribeNewsletter()" class="flex">
                <input 
                  type="email" 
                  required
                  [(ngModel)]="newsletterEmail"
                  name="newsletterEmail"
                  placeholder="Votre adresse email"
                  class="flex-1 px-sm py-xs text-sm text-text bg-white rounded-l-md focus:outline-none focus:ring-2 focus:ring-primary"
                >
                <button 
                  type="submit" 
                  [disabled]="isSubscribing() || !newsletterEmail.trim()"
                  class="btn btn-primary btn-sm rounded-l-none cursor-pointer disabled:opacity-50"
                >
                  @if (isSubscribing()) {
                    <svg class="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  } @else {
                    <span>S'abonner</span>
                  }
                </button>
              </form>

              @if (newsletterFeedback()) {
                <p 
                  class="text-xs transition-opacity duration-300"
                  [class.text-green-700]="feedbackType() === 'success'"
                  [class.text-red-600]="feedbackType() === 'error'"
                >
                  {{ newsletterFeedback() }}
                </p>
              }
            </div>
          </div>
        </div>

        <!-- Bottom Section -->
        <div class="border-t border-white/20 mt-xl pt-lg">
          <div class="flex justify-center items-center gap-md">
            <p class="text-sm">
              © {{ currentYear }} DevFest Kivu. Tous droits réservés.
            </p>
          </div>
        </div>
      </div>
    </footer>
  `,
  styles: ``
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
