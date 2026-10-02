import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { EventConfigService } from '../../services/event-config.service';
import { FirestoreService } from '../../../../core/firestore/firestore.service';
import { Speaker } from '../../models/speaker.model';

@Component({
  selector: 'app-speakers',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <!-- Header -->
        <div class="text-center mb-16 animate-fade-in-up">
          <h1 class="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
            Speakers {{ eventConfig.year }}
          </h1>
          <p class="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Découvrez les esprits brillants qui façonneront le DevFest Kivu {{ eventConfig.year }}.
          </p>
        </div>

        <!-- Speakers Grid or Empty state -->
        @if (isLoading()) {
          <div class="text-center py-16 text-gray-500">Chargement des intervenants...</div>
        } @else if (speakers().length > 0) {
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            @for (s of speakers(); track s.id || $index) {
              <div
                class="group bg-white rounded-2xl border border-gray-200 p-6 flex flex-col items-center text-center transition-all duration-300 hover:shadow-md hover:border-gray-300 animate-fade-in-up"
                [style.animationDelay]="$index * 80 + 'ms'"
              >
                <div class="relative mb-5">
                  <img
                    [src]="s.photo || 'assets/logo.png'"
                    [alt]="s.name"
                    class="w-28 h-28 rounded-full object-cover border-2 border-gray-100 shadow-xs group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                <h3 class="text-lg font-bold text-gray-900 mb-1">
                  {{ s.name }}
                </h3>

                <p class="text-sm text-gray-500 mb-4 line-clamp-2 px-2">
                  {{ s.title }}
                </p>

                <div class="mt-auto">
                  @if (s.socials.linkedin) {
                    <a
                      [href]="s.socials.linkedin"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="inline-flex items-center justify-center w-9 h-9 rounded-full bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors duration-200"
                      aria-label="LinkedIn Profile"
                    >
                      <svg
                        class="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"
                        />
                      </svg>
                    </a>
                  }
                </div>
              </div>
            }
          </div>
        } @else {
          <div class="text-center py-16">
            <p class="text-lg text-gray-500">Les intervenants seront annoncés prochainement.</p>
          </div>
        }

        <!-- Event Details (Minimalist) -->
        <div class="mt-20 border-t border-gray-100 pt-12">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            <div class="flex flex-col items-center text-center">
              <div
                class="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-700 mb-3"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 class="text-base font-semibold text-gray-900 mb-1">Date & Heure</h3>
              <p class="text-sm text-gray-600">
                {{ eventConfig.getFormattedDateRange() }}
              </p>
              <p class="text-xs text-gray-500">09h00 - 18h00</p>
            </div>

            <div class="flex flex-col items-center text-center">
              <div
                class="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-700 mb-3"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <h3 class="text-base font-semibold text-gray-900 mb-1">Lieu</h3>
              <p class="text-sm text-gray-600">{{ eventConfig.venue.conferenceCenter }}</p>
              <p class="text-xs text-gray-500">{{ eventConfig.venue.fullLocation }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: `
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(12px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .animate-fade-in-up {
      animation: fadeInUp 0.4s ease-out forwards;
      opacity: 0;
    }
  `,
})
export default class Speakers implements OnInit {
  eventConfig = inject(EventConfigService);
  private fs = inject(FirestoreService);

  speakers = signal<Speaker[]>([]);
  isLoading = signal(true);

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    this.fs.getCurrentEditionId().subscribe((editionId) => {
      this.fs
        .getPublishedEventCollection<Speaker>(editionId, 'speakers', {
          field: 'status',
          value: 'published',
        })
        .subscribe({
          next: (fsSpeakers) => {
            this.speakers.set(fsSpeakers || []);
            this.isLoading.set(false);
          },
          error: () => {
            this.speakers.set([]);
            this.isLoading.set(false);
          },
        });
    });
  }
}
