import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SpeakersService } from '../../../../cms/services/speakers.service';
import { FirestoreService } from '../../../../../core/firestore/firestore.service';
import { EventConfigService } from '../../../../event/services/event-config.service';

@Component({
  selector: 'app-admin-cms',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-6 animate-fade-in">
      <!-- CMS Header Banner -->
      <div class="bg-white rounded-2xl p-6 sm:p-8 shadow-xs border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-[#4285F4]"></span>
            <span class="text-xs font-bold uppercase tracking-wider text-[#4285F4]">Module CMS</span>
          </div>
          <h2 class="text-xl sm:text-2xl font-bold text-gray-900 mt-1">
            Gestion des Contenus du Site Web
          </h2>
          <p class="text-xs sm:text-sm text-gray-500 mt-1">
            Pilotez les intervenants, partenaires, planning de l'événement et sections informatives du site public.
          </p>
        </div>

        <div class="flex items-center gap-2 flex-wrap">
          <a
            routerLink="/"
            target="_blank"
            class="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition cursor-pointer"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
            </svg>
            <span>Voir le site public</span>
          </a>
        </div>
      </div>

      <!-- CMS Modules Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- Module 1: Speakers -->
        <div class="bg-white rounded-2xl p-6 shadow-xs border border-gray-100 flex flex-col justify-between hover:shadow-md transition">
          <div class="space-y-3">
            <div class="w-12 h-12 rounded-xl bg-blue-50 text-[#4285F4] flex items-center justify-center">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z"/>
              </svg>
            </div>
            <div>
              <div class="flex items-center justify-between">
                <h3 class="text-base font-bold text-gray-900">Intervenants & Speakers</h3>
                <span class="text-xs font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                  {{ speakersCount }}
                </span>
              </div>
              <p class="text-xs text-gray-500 mt-1 leading-relaxed">
                Gérez les profils, biographies, photos et réseaux sociaux des intervenants du festival.
              </p>
            </div>
          </div>

          <div class="pt-5 flex items-center justify-between border-t border-gray-100 mt-4">
            <a
              routerLink="/speakers"
              class="text-xs font-semibold text-[#4285F4] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Accéder à la section</span>
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </a>
          </div>
        </div>

        <!-- Module 2: Agenda / Programme -->
        <div class="bg-white rounded-2xl p-6 shadow-xs border border-gray-100 flex flex-col justify-between hover:shadow-md transition">
          <div class="space-y-3">
            <div class="w-12 h-12 rounded-xl bg-green-50 text-[#34A853] flex items-center justify-center">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
            </div>
            <div>
              <h3 class="text-base font-bold text-gray-900">Agenda & Programme</h3>
              <p class="text-xs text-gray-500 mt-1 leading-relaxed">
                Structurez les créneaux horaires, les salles et le déroulement des 2 journées du festival.
              </p>
            </div>
          </div>

          <div class="pt-5 flex items-center justify-between border-t border-gray-100 mt-4">
            <a
              routerLink="/agenda"
              class="text-xs font-semibold text-[#34A853] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Voir le programme</span>
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </a>
          </div>
        </div>

        <!-- Module 3: Sponsors & Partenaires -->
        <div class="bg-white rounded-2xl p-6 shadow-xs border border-gray-100 flex flex-col justify-between hover:shadow-md transition">
          <div class="space-y-3">
            <div class="w-12 h-12 rounded-xl bg-amber-50 text-[#FBBC04] flex items-center justify-center">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
              </svg>
            </div>
            <div>
              <h3 class="text-base font-bold text-gray-900">Sponsors & Partenaires</h3>
              <p class="text-xs text-gray-500 mt-1 leading-relaxed">
                Mettez en avant les entreprises partenaires, leurs logos et leurs niveaux de sponsoring.
              </p>
            </div>
          </div>

          <div class="pt-5 flex items-center justify-between border-t border-gray-100 mt-4">
            <a
              routerLink="/sponsor"
              class="text-xs font-semibold text-amber-700 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Accéder aux partenaires</span>
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </a>
          </div>
        </div>

        <!-- Module 4: Questions Fréquentes (FAQ) -->
        <div class="bg-white rounded-2xl p-6 shadow-xs border border-gray-100 flex flex-col justify-between hover:shadow-md transition">
          <div class="space-y-3">
            <div class="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <div>
              <h3 class="text-base font-bold text-gray-900">Foire Aux Questions (FAQ)</h3>
              <p class="text-xs text-gray-500 mt-1 leading-relaxed">
                Rédigez les réponses aux questions courantes des participants pour fluidifier l'accueil.
              </p>
            </div>
          </div>

          <div class="pt-5 flex items-center justify-between border-t border-gray-100 mt-4">
            <a
              routerLink="/qa"
              class="text-xs font-semibold text-purple-600 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Gérer les FAQ</span>
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </a>
          </div>
        </div>

        <!-- Module 5: Générateur DP (Badge Avatar) -->
        <div class="bg-white rounded-2xl p-6 shadow-xs border border-gray-100 flex flex-col justify-between hover:shadow-md transition">
          <div class="space-y-3">
            <div class="w-12 h-12 rounded-xl bg-red-50 text-[#EA4335] flex items-center justify-center">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
            </div>
            <div>
              <h3 class="text-base font-bold text-gray-900">Générateur de Badge (DP)</h3>
              <p class="text-xs text-gray-500 mt-1 leading-relaxed">
                Permettez aux participants de créer leur photo de profil personnalisée aux couleurs du festival.
              </p>
            </div>
          </div>

          <div class="pt-5 flex items-center justify-between border-t border-gray-100 mt-4">
            <a
              routerLink="/dp-generator"
              class="text-xs font-semibold text-[#EA4335] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Accéder au générateur</span>
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: `
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in {
      animation: fadeIn 0.3s ease-out forwards;
    }
  `,
})
export class AdminCms {
  private readonly speakersService = inject(SpeakersService);
  readonly eventConfig = inject(EventConfigService);

  get speakersCount(): number {
    return this.speakersService.getSpeakers().length;
  }
}
export default AdminCms;
