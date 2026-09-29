import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  imports: [RouterLink],
  template: `
    <footer class="bg-accent-pastel ">
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
              <a href="#" class="block text-sm transition-all duration-200 hover:text-primary hover:underline underline-offset-2">
                Code de conduite
              </a>
              <a href="#" class="block text-sm transition-all duration-200 hover:text-primary hover:underline underline-offset-2">
                Contact
              </a>
            </nav>
          </div>

          <!-- Social Media -->
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
                href="https://instagram.com/devfestkivu" 
                target="_blank" 
                rel="noopener noreferrer"
                class="flex items-center justify-center w-10 h-10 bg-text/20 hover:bg-primary hover:text-white rounded-md transition-all duration-200 hover:scale-110 hover:shadow-md"
                aria-label="Instagram"
              >
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.987 11.987 6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.648.001 12.017.001zM8.449 20.312c-4.27 0-7.73-3.46-7.73-7.73s3.46-7.73 7.73-7.73 7.73 3.46 7.73 7.73-3.46 7.73-7.73 7.73z"/>
                  <path d="M12.017 4.729c-3.994 0-7.258 3.263-7.258 7.258 0 3.994 3.263 7.258 7.258 7.258 3.994 0 7.258-3.263 7.258-7.258 0-3.994-3.263-7.258-7.258-7.258zm0 11.985c-2.614 0-4.727-2.113-4.727-4.727s2.113-4.727 4.727-4.727 4.727 2.113 4.727 4.727-2.113 4.727-4.727 4.727z"/>
                  <circle cx="19.204" cy="4.796" r="1.615"/>
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
            <div class="mt-md">
              <p class="text-sm mb-sm">Restez informé des actualités</p>
              <div class="flex">
                <input 
                  type="email" 
                  placeholder="Votre email"
                  class="flex-1 px-sm py-xs text-sm text-text bg-white rounded-l-md focus:outline-none focus:ring-2 focus:ring-primary"
                >
                <button class="btn btn-primary btn-sm rounded-l-none">
                  S'abonner
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Bottom Section -->
        <div class="border-t border-white/20 mt-xl pt-lg">
          <div class="flex justify-center items-center gap-md">
            <p class="text-sm ">
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
  currentYear = new Date().getFullYear();
}
