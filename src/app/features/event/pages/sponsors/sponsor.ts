import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventConfigService } from '../../services/event-config.service';
import { FirestoreService } from '../../../../core/firestore/firestore.service';
import { EventPartner } from '../../models/partner.model';

interface SponsorData {
  name: string;
  role: string;
  quote: string;
  image: string;
  link: string;
}

@Component({
  selector: 'app-sponsor',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-gray-50 via-white to-yellow-50/30">
      <!-- Hero Section -->
      <section class="relative py-20 px-4 overflow-hidden">
        <!-- Background Elements -->
        <div class="absolute inset-0">
          <div
            class="absolute top-20 left-10 w-72 h-72 bg-yellow-400/10 rounded-full blur-3xl"
          ></div>
          <div
            class="absolute bottom-20 right-10 w-96 h-96 bg-orange-400/10 rounded-full blur-3xl"
          ></div>
        </div>

        <div class="max-w-7xl mx-auto relative z-10">
          <div class="text-center mb-16">
            <div
              class="inline-flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium mb-6"
            >
              <span class="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
              Partenaires Officiels
            </div>

            <h1 class="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6">
              Nos
              <span
                class="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-orange-500"
                >Partenaires</span
              >
            </h1>

            <p class="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed mb-8">
              Les organisations visionnaires qui rendent {{ eventConfig.fullName }} possible.
              Ensemble, nous construisons l'avenir de la technologie en Afrique.
            </p>

            <!-- Partner Types -->
            <div class="flex flex-wrap justify-center gap-3 mb-10">
              <span
                class="px-4 py-2 bg-white/80 backdrop-blur-sm border border-yellow-200 text-yellow-700 rounded-full text-sm font-medium shadow-sm"
              >
                Partenaire Principal
              </span>
              <span
                class="px-4 py-2 bg-white/80 backdrop-blur-sm border border-blue-200 text-blue-700 rounded-full text-sm font-medium shadow-sm"
              >
                Partenaires Média
              </span>
              <span
                class="px-4 py-2 bg-white/80 backdrop-blur-sm border border-green-200 text-green-700 rounded-full text-sm font-medium shadow-sm"
              >
                Partenaire Technique
              </span>
            </div>

            <a href="mailto:contact@devfestkivu.com" class="btn btn-primary">
              <span>Devenir Partenaire</span>
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                ></path>
              </svg>
            </a>
          </div>

          <!-- Quick Preview Cards -->
          <div class="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div
              class="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg"
            >
              <div class="flex items-center gap-3 mb-4">
                <div class="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
                  <span class="text-white font-bold text-lg">🏆</span>
                </div>
                <h3 class="text-lg font-semibold text-gray-900">Partenaire Principal</h3>
              </div>
              <div class="flex items-center gap-4">
                @for (s of mainSponsors; track s.name) {
                  <div
                    class="w-16 h-16 rounded-xl overflow-hidden border-2 border-yellow-200 shadow-sm flex items-center justify-center bg-white"
                  >
                    <a
                      [href]="s.link"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="w-full h-full flex items-center justify-center"
                    >
                      <img
                        [src]="s.image"
                        [alt]="s.name"
                        class="max-w-full max-h-full object-contain"
                      />
                    </a>
                  </div>
                }
              </div>
            </div>

            <div
              class="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg"
            >
              <div class="flex items-center gap-3 mb-4">
                <div class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <span class="text-white font-bold text-lg">🤝</span>
                </div>
                <h3 class="text-lg font-semibold text-gray-900">Autres Partenaires</h3>
              </div>
              <div class="flex gap-3">
                @for (p of otherSponsors; track p.name) {
                  <div
                    class="w-12 h-12 rounded-lg overflow-hidden border-2 border-gray-200 shadow-sm flex items-center justify-center bg-white"
                  >
                    <a
                      [href]="p.link"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="w-full h-full flex items-center justify-center"
                    >
                      <img
                        [src]="p.image"
                        [alt]="p.name"
                        class="max-w-full max-h-full object-contain"
                      />
                    </a>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Main Sponsor Showcase -->
      <section class="py-20 px-4">
        <div class="max-w-6xl mx-auto">
          <div class="text-center mb-16">
            <h2 class="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Partenaire Principal</h2>
            <div class="w-24 h-1 bg-yellow-500 mx-auto rounded-full"></div>
          </div>

          @for (sponsor of mainSponsors; track sponsor.name) {
            <div class="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden mb-5">
              <!-- Header -->
              <div class="bg-gray-50 border-b border-gray-200 p-8">
                <div class="flex flex-col md:flex-row items-center gap-6">
                  <!-- Image Sponsor -->
                  <div class="flex-shrink-0">
                    <div
                      class="w-20 h-20 rounded-xl bg-white border-2 border-gray-200 flex items-center justify-center overflow-hidden"
                    >
                      <a
                        [href]="sponsor.link"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="w-full h-full flex items-center justify-center"
                      >
                        <img
                          [src]="sponsor.image"
                          [alt]="sponsor.name"
                          class="max-w-full max-h-full object-contain"
                        />
                      </a>
                    </div>
                  </div>

                  <!-- Sponsor Info -->
                  <div class="text-center md:text-left">
                    <h3 class="text-2xl font-bold text-gray-900 mb-1">{{ sponsor.name }}</h3>
                    <p class="text-yellow-600 font-semibold text-lg">{{ sponsor.role }}</p>
                    <div class="flex items-center justify-center md:justify-start gap-2 mt-2">
                      <span class="w-2 h-2 bg-green-500 rounded-full"></span>
                      <span class="text-sm text-gray-600"
                        >Partenaire Actif • {{ eventConfig.fullName }}</span
                      >
                    </div>
                  </div>
                </div>
              </div>

              <!-- Content -->
              <div class="p-8 md:p-10">
                <div class="max-w-3xl mx-auto">
                  <!-- Quote -->
                  <blockquote
                    class="text-lg md:text-xl text-gray-700 leading-relaxed text-center italic mb-6"
                  >
                    "{{ sponsor.quote }}"
                  </blockquote>

                  <!-- Badge -->
                  <div class="flex justify-center">
                    <div
                      class="inline-flex items-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-700 rounded-full text-sm font-medium"
                    >
                      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fill-rule="evenodd"
                          clip-rule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        ></path>
                      </svg>
                      Partenaire Officiel
                    </div>
                  </div>
                </div>
              </div>
            </div>
          }
        </div>
      </section>

      <!-- Partners Grid -->
      <section class="py-20 px-4 bg-gray-50">
        <div class="max-w-7xl mx-auto">
          <div class="text-center mb-16">
            <h2 class="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Nos Partenaires</h2>
            <p class="text-xl text-gray-600 max-w-2xl mx-auto">
              Découvrez les organisations qui nous accompagnent dans cette aventure technologique
            </p>
            <div
              class="w-24 h-1 bg-gradient-to-r from-yellow-500 to-orange-500 mx-auto rounded-full mt-6"
            ></div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            @for (sponsor of otherSponsors; track sponsor.name) {
              <div class="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
                <!-- Logo Container -->
                <div class="flex justify-center mb-6">
                  <div
                    class="w-24 h-24 rounded-2xl bg-gray-50 flex items-center justify-center border border-gray-200 overflow-hidden"
                  >
                    <a
                      [href]="sponsor.link"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="w-full h-full flex items-center justify-center"
                    >
                      <img
                        [src]="sponsor.image"
                        [alt]="sponsor.name"
                        class="max-w-full max-h-full object-contain"
                      />
                    </a>
                  </div>
                </div>

                <!-- Content -->
                <div class="text-center">
                  <h3 class="text-xl font-bold text-gray-900 mb-2">
                    {{ sponsor.name }}
                  </h3>
                  <p
                    class="text-sm font-medium text-yellow-600 mb-4 px-3 py-1 bg-yellow-50 rounded-full inline-block"
                  >
                    {{ sponsor.role }}
                  </p>
                  <p class="text-gray-600 text-sm leading-relaxed">
                    {{ sponsor.quote }}
                  </p>
                </div>
              </div>
            }
          </div>
        </div>
      </section>

      <!-- Call to Action -->
      <section class="py-20 px-4">
        <div class="max-w-4xl mx-auto">
          <div class="p-12 md:p-16  text-center relative overflow-hidden">
            <div class="relative z-10">
              <h3 class="text-3xl md:text-4xl font-bold mb-6">Prêt à nous rejoindre ?</h3>
              <p class="text-xl opacity-90 mb-8 max-w-2xl mx-auto leading-relaxed">
                Votre organisation souhaite s'associer à {{ eventConfig.fullName }} ? Contactez
                notre équipe pour découvrir les opportunités de partenariat.
              </p>

              <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <a
                  href="mailto:gdgkivu@gmail.com"
                  class="inline-flex items-center gap-3 bg-white text-yellow-600 font-bold px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    ></path>
                  </svg>
                  Contactez-nous
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: ``,
})
export default class Sponsor implements OnInit {
  eventConfig = inject(EventConfigService);
  private fs = inject(FirestoreService);

  get initialFallbackSponsors(): SponsorData[] {
    return this.eventConfig.supports.map((support) => ({
      name: support.name,
      role: support.role,
      quote: support.quote,
      image: support.logo,
      link: support.link,
    }));
  }

  sponsors: SponsorData[] = [];

  get mainSponsors(): SponsorData[] {
    return this.sponsors.filter((sponsor) => sponsor.role === 'Partenaire Principal');
  }

  get otherSponsors(): SponsorData[] {
    return this.sponsors.filter((sponsor) => sponsor.role !== 'Partenaire Principal');
  }

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    this.sponsors = this.initialFallbackSponsors;

    this.fs.getCurrentEditionId().subscribe((editionId) => {
      this.fs.getPublishedEventCollection<EventPartner>(editionId, 'partners').subscribe({
        next: (items) => {
          if (items && items.length > 0) {
            this.sponsors = items.map((p) => ({
              name: p.name,
              role: p.role,
              quote: p.quote || '',
              image: p.logo,
              link: p.link || '',
            }));
          } else {
            this.sponsors = this.initialFallbackSponsors;
          }
        },
        error: () => {
          this.sponsors = this.initialFallbackSponsors;
        },
      });
    });
  }
}
