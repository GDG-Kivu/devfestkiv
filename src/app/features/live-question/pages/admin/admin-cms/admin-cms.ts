import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription, combineLatest } from 'rxjs';
import { FirestoreService } from '../../../../../core/firestore/firestore.service';
import { EventDocument } from '../../../../event/models/event.model';
import { Speaker } from '../../../../event/models/speaker.model';
import { AgendaItem } from '../../../../event/models/agenda-item.model';
import { FaqItem } from '../../../../event/models/faq-item.model';
import { EventPartner } from '../../../../event/models/partner.model';

import { EventConfigModalComponent } from './modals/event-config-modal.component';
import { SpeakersModalComponent } from './modals/speakers-modal.component';
import { AgendaModalComponent } from './modals/agenda-modal.component';
import { FaqModalComponent } from './modals/faq-modal.component';
import { GalleryModalComponent } from './modals/gallery-modal.component';
import { PartnersModalComponent } from './modals/partners-modal.component';
import { DpTemplateModalComponent } from './modals/dp-template-modal.component';
import { NewEditionModalComponent } from './modals/new-edition-modal.component';

@Component({
  selector: 'app-admin-cms',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    EventConfigModalComponent,
    SpeakersModalComponent,
    AgendaModalComponent,
    FaqModalComponent,
    GalleryModalComponent,
    PartnersModalComponent,
    DpTemplateModalComponent,
    NewEditionModalComponent,
  ],
  template: `
    <div class="space-y-6 animate-fade-in">

      <!-- Edition Selector Controls -->
      <div class="bg-white rounded-2xl px-5 py-4 shadow-xs border border-gray-100 flex flex-wrap items-center gap-3">
          
          <!-- Edition Switcher Dropdown -->
          <div class="flex items-center gap-2 bg-gray-50 px-3.5 py-2 rounded-xl border border-gray-200">
            <label for="editionSelector" class="text-xs font-bold text-gray-700 whitespace-nowrap">
              Édition :
            </label>
            <select
              id="editionSelector"
              [ngModel]="selectedEditionId()"
              (ngModelChange)="onEditionChange($event)"
              class="bg-transparent text-xs sm:text-sm font-bold text-[#4285F4] focus:outline-none cursor-pointer pr-2"
            >
              @for (ed of availableEditions(); track ed) {
                <option [value]="ed">
                  {{ ed }} {{ ed === liveEditionId() ? '★ (En ligne)' : '' }}
                </option>
              }
            </select>
          </div>

          <!-- New Edition Button -->
          <button
            type="button"
            (click)="showNewEditionModal.set(true)"
            class="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-xl transition cursor-pointer"
            title="Créer une nouvelle édition"
          >
            <svg class="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            <span>Nouvelle Édition</span>
          </button>

          <!-- Set as Active Live Edition Action -->
          @if (selectedEditionId() !== liveEditionId()) {
            <button
              type="button"
              (click)="setAsLiveEdition()"
              [disabled]="isSettingLive()"
              class="inline-flex items-center gap-2 px-4 py-2 bg-[#34A853] hover:bg-[#2d9248] disabled:bg-gray-300 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
              title="Rendre cette édition active pour l'ensemble du site public"
            >
              @if (isSettingLive()) {
                <svg class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              } @else {
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
              }
              <span>Activer sur le site</span>
            </button>
          }

          <!-- View Public Site (aligned to the end) -->
          <a
            routerLink="/"
            target="_blank"
            class="sm:ml-auto inline-flex items-center gap-1.5 px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition cursor-pointer"
          >
            <svg class="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
            </svg>
            <span>Voir le site</span>
          </a>
      </div>

      <!-- Active Edition Indicator / Status Feedback -->
      @if (statusMessage()) {
        <div class="p-3 bg-green-50 text-green-800 border border-green-200 rounded-xl text-xs flex items-center justify-between">
          <span>{{ statusMessage() }}</span>
          <button (click)="statusMessage.set(null)" class="text-green-600 hover:text-green-900 font-bold">✕</button>
        </div>
      }

      <!-- Modules Loading State -->
      @if (isLoadingModules()) {
        <div class="py-16 text-center text-gray-400 flex flex-col items-center gap-3">
          <svg class="w-10 h-10 animate-spin text-[#4285F4]" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span class="text-sm font-semibold">Chargement des contenus de l'édition {{ selectedEditionId() }}...</span>
        </div>
      } @else {
        <!-- CMS Modules 7 Cards Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          <!-- CARD 1: Event Global Config -->
          <div class="bg-white rounded-2xl p-6 shadow-xs border border-gray-100 flex flex-col justify-between hover:shadow-md transition">
            <div class="space-y-3">
              <div class="flex items-start justify-between gap-2">
                <div class="flex items-center gap-3">
                  <div class="w-12 h-12 rounded-xl bg-blue-50 text-[#4285F4] flex items-center justify-center flex-shrink-0">
                    <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>
                  </div>
                  <div>
                    <div class="flex items-center gap-2">
                      <h3 class="text-base font-bold text-gray-900">Configuration Globale</h3>
                      <span class="text-xs font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                        {{ currentEvent()?.year || selectedEditionId() }}
                      </span>
                    </div>
                    <p class="text-xs text-gray-500 mt-0.5 leading-relaxed">
                      Lieu, dates, thème, liens d'inscription et paramètres.
                    </p>
                  </div>
                </div>

                <!-- Edit Button -->
                <button
                  type="button"
                  (click)="openModal('config')"
                  class="p-2 rounded-xl bg-gray-50 hover:bg-blue-50 text-gray-400 hover:text-[#4285F4] border border-gray-100 hover:border-blue-200 transition cursor-pointer flex-shrink-0"
                  title="Modifier les infos globales"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                </button>
              </div>

              @if (currentEvent()?.venue?.conferenceCenter) {
                <p class="text-[11px] text-gray-400 font-mono">📍 {{ currentEvent()?.venue?.conferenceCenter }}</p>
              }
            </div>

            <!-- Preview Link -->
            <div class="pt-4 flex items-center border-t border-gray-100 mt-4">
              <a
                routerLink="/"
                target="_blank"
                class="text-xs font-semibold text-[#4285F4] hover:underline inline-flex items-center gap-1.5 cursor-pointer"
              >
                <span>Prévisualiser l'accueil</span>
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                </svg>
              </a>
            </div>
          </div>

          <!-- CARD 2: Speakers -->
          <div class="bg-white rounded-2xl p-6 shadow-xs border border-gray-100 flex flex-col justify-between hover:shadow-md transition">
            <div class="space-y-3">
              <div class="flex items-start justify-between gap-2">
                <div class="flex items-center gap-3">
                  <div class="w-12 h-12 rounded-xl bg-blue-50 text-[#4285F4] flex items-center justify-center flex-shrink-0">
                    <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z"/>
                    </svg>
                  </div>
                  <div>
                    <div class="flex items-center gap-2">
                      <h3 class="text-base font-bold text-gray-900">Intervenants & Speakers</h3>
                      <span class="text-xs font-bold bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full">
                        {{ speakersCount() }}
                      </span>
                    </div>
                    <p class="text-xs text-gray-500 mt-0.5 leading-relaxed">
                      Profils, biographies, photos et réseaux.
                    </p>
                  </div>
                </div>

                <!-- Edit Button -->
                <button
                  type="button"
                  (click)="openModal('speakers')"
                  class="p-2 rounded-xl bg-gray-50 hover:bg-blue-50 text-gray-400 hover:text-[#4285F4] border border-gray-100 hover:border-blue-200 transition cursor-pointer flex-shrink-0"
                  title="Gérer les speakers"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                </button>
              </div>
            </div>

            <!-- Preview Link -->
            <div class="pt-4 flex items-center border-t border-gray-100 mt-4">
              <a
                routerLink="/speakers"
                target="_blank"
                class="text-xs font-semibold text-[#4285F4] hover:underline inline-flex items-center gap-1.5 cursor-pointer"
              >
                <span>Prévisualiser les speakers</span>
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                </svg>
              </a>
            </div>
          </div>

          <!-- CARD 3: Agenda / Programme -->
          <div class="bg-white rounded-2xl p-6 shadow-xs border border-gray-100 flex flex-col justify-between hover:shadow-md transition">
            <div class="space-y-3">
              <div class="flex items-start justify-between gap-2">
                <div class="flex items-center gap-3">
                  <div class="w-12 h-12 rounded-xl bg-green-50 text-[#34A853] flex items-center justify-center flex-shrink-0">
                    <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                  </div>
                  <div>
                    <div class="flex items-center gap-2">
                      <h3 class="text-base font-bold text-gray-900">Agenda & Programme</h3>
                      <span class="text-xs font-bold bg-green-100 text-green-800 px-2.5 py-0.5 rounded-full">
                        {{ agendaCount() }} 
                      </span>
                    </div>
                    <p class="text-xs text-gray-500 mt-0.5 leading-relaxed">
                      Créneaux horaires, salles et formats.
                    </p>
                  </div>
                </div>

                <!-- Edit Button -->
                <button
                  type="button"
                  (click)="openModal('agenda')"
                  class="p-2 rounded-xl bg-gray-50 hover:bg-green-50 text-gray-400 hover:text-[#34A853] border border-gray-100 hover:border-green-200 transition cursor-pointer flex-shrink-0"
                  title="Gérer le programme"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                </button>
              </div>
            </div>

            <!-- Preview Link -->
            <div class="pt-4 flex items-center border-t border-gray-100 mt-4">
              <a
                routerLink="/agenda"
                target="_blank"
                class="text-xs font-semibold text-[#34A853] hover:underline inline-flex items-center gap-1.5 cursor-pointer"
              >
                <span>Prévisualiser le programme</span>
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                </svg>
              </a>
            </div>
          </div>

          <!-- CARD 4: Questions Fréquentes (FAQ) -->
          <div class="bg-white rounded-2xl p-6 shadow-xs border border-gray-100 flex flex-col justify-between hover:shadow-md transition">
            <div class="space-y-3">
              <div class="flex items-start justify-between gap-2">
                <div class="flex items-center gap-3">
                  <div class="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
                    <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                  <div>
                    <div class="flex items-center gap-2">
                      <h3 class="text-base font-bold text-gray-900">Foire Aux Questions (FAQ)</h3>
                      <span class="text-xs font-bold bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full">
                        {{ faqCount() }}
                      </span>
                    </div>
                    <p class="text-xs text-gray-500 mt-0.5 leading-relaxed">
                      Réponses aux questions des participants.
                    </p>
                  </div>
                </div>

                <!-- Edit Button -->
                <button
                  type="button"
                  (click)="openModal('faq')"
                  class="p-2 rounded-xl bg-gray-50 hover:bg-purple-50 text-gray-400 hover:text-purple-600 border border-gray-100 hover:border-purple-200 transition cursor-pointer flex-shrink-0"
                  title="Gérer les FAQ"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                </button>
              </div>
            </div>

            <!-- Preview Link -->
            <div class="pt-4 flex items-center border-t border-gray-100 mt-4">
              <a
                routerLink="/qa"
                target="_blank"
                class="text-xs font-semibold text-purple-600 hover:underline inline-flex items-center gap-1.5 cursor-pointer"
              >
                <span>Prévisualiser la FAQ</span>
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                </svg>
              </a>
            </div>
          </div>

          <!-- CARD 5: Galerie & Albums Photos -->
          <div class="bg-white rounded-2xl p-6 shadow-xs border border-gray-100 flex flex-col justify-between hover:shadow-md transition">
            <div class="space-y-3">
              <div class="flex items-start justify-between gap-2">
                <div class="flex items-center gap-3">
                  <div class="w-12 h-12 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center flex-shrink-0">
                    <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                  </div>
                  <div>
                    <div class="flex items-center gap-2">
                      <h3 class="text-base font-bold text-gray-900">Galerie & Albums</h3>
                      <span class="text-xs font-bold bg-pink-100 text-pink-800 px-2.5 py-0.5 rounded-full">
                        {{ galleryPhotosCount() }} 
                      </span>
                    </div>
                    <p class="text-xs text-gray-500 mt-0.5 leading-relaxed">
                      Photos et albums publics de la communauté.
                    </p>
                  </div>
                </div>

                <!-- Edit Button -->
                <button
                  type="button"
                  (click)="openModal('gallery')"
                  class="p-2 rounded-xl bg-gray-50 hover:bg-pink-50 text-gray-400 hover:text-pink-600 border border-gray-100 hover:border-pink-200 transition cursor-pointer flex-shrink-0"
                  title="Gérer les photos & albums"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                </button>
              </div>
            </div>

            <!-- Preview Link -->
            <div class="pt-4 flex items-center border-t border-gray-100 mt-4">
              <a
                routerLink="/"
                target="_blank"
                class="text-xs font-semibold text-pink-600 hover:underline inline-flex items-center gap-1.5 cursor-pointer"
              >
                <span>Prévisualiser la galerie</span>
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                </svg>
              </a>
            </div>
          </div>

          <!-- CARD 6: Partenaires & Sponsors -->
          <div class="bg-white rounded-2xl p-6 shadow-xs border border-gray-100 flex flex-col justify-between hover:shadow-md transition">
            <div class="space-y-3">
              <div class="flex items-start justify-between gap-2">
                <div class="flex items-center gap-3">
                  <div class="w-12 h-12 rounded-xl bg-amber-50 text-[#FBBC04] flex items-center justify-center flex-shrink-0">
                    <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                    </svg>
                  </div>
                  <div>
                    <div class="flex items-center gap-2">
                      <h3 class="text-base font-bold text-gray-900">Sponsors & Partenaires</h3>
                      <span class="text-xs font-bold bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full">
                        {{ partnersCount() }}
                      </span>
                    </div>
                    <p class="text-xs text-gray-500 mt-0.5 leading-relaxed">
                      Logos, niveaux de sponsoring et liens.
                    </p>
                  </div>
                </div>

                <!-- Edit Button -->
                <button
                  type="button"
                  (click)="openModal('partners')"
                  class="p-2 rounded-xl bg-gray-50 hover:bg-amber-50 text-gray-400 hover:text-amber-700 border border-gray-100 hover:border-amber-200 transition cursor-pointer flex-shrink-0"
                  title="Gérer les partenaires"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                </button>
              </div>
            </div>

            <!-- Preview Link -->
            <div class="pt-4 flex items-center border-t border-gray-100 mt-4">
              <a
                routerLink="/sponsor"
                target="_blank"
                class="text-xs font-semibold text-amber-700 hover:underline inline-flex items-center gap-1.5 cursor-pointer"
              >
                <span>Prévisualiser les sponsors</span>
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                </svg>
              </a>
            </div>
          </div>

          <!-- CARD 7: Templates du Générateur DP -->
          <div class="bg-white rounded-2xl p-6 shadow-xs border border-gray-100 flex flex-col justify-between hover:shadow-md transition">
            <div class="space-y-3">
              <div class="flex items-start justify-between gap-2">
                <div class="flex items-center gap-3">
                  <div class="w-12 h-12 rounded-xl bg-red-50 text-[#EA4335] flex items-center justify-center flex-shrink-0">
                    <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                  </div>
                  <div>
                    <div class="flex items-center gap-2">
                      <h3 class="text-base font-bold text-gray-900">Templates Générateur DP</h3>
                      <span class="text-xs font-bold bg-red-100 text-[#EA4335] px-2.5 py-0.5 rounded-full">
                        Badge
                      </span>
                    </div>
                    <p class="text-xs text-gray-500 mt-0.5 leading-relaxed">
                      Cadres, couleurs et citations pour le badge.
                    </p>
                  </div>
                </div>

                <!-- Edit Button -->
                <button
                  type="button"
                  (click)="openModal('dp-template')"
                  class="p-2 rounded-xl bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-[#EA4335] border border-gray-100 hover:border-red-200 transition cursor-pointer flex-shrink-0"
                  title="Personnaliser le design DP"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                </button>
              </div>
            </div>

            <!-- Preview Link -->
            <div class="pt-4 flex items-center border-t border-gray-100 mt-4">
              <a
                routerLink="/dp-generator"
                target="_blank"
                class="text-xs font-semibold text-[#EA4335] hover:underline inline-flex items-center gap-1.5 cursor-pointer"
              >
                <span>Prévisualiser le générateur</span>
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                </svg>
              </a>
            </div>
          </div>

        </div>
      }
    </div>

    <!-- MODALS -->
    @if (activeModal() === 'config') {
      <app-event-config-modal
        [editionId]="selectedEditionId()"
        (close)="closeModal()"
        (updated)="onDataUpdated()"
      />
    }

    @if (activeModal() === 'speakers') {
      <app-speakers-modal
        [editionId]="selectedEditionId()"
        (close)="closeModal()"
        (updated)="onDataUpdated()"
      />
    }

    @if (activeModal() === 'agenda') {
      <app-agenda-modal
        [editionId]="selectedEditionId()"
        (close)="closeModal()"
        (updated)="onDataUpdated()"
      />
    }

    @if (activeModal() === 'faq') {
      <app-faq-modal
        [editionId]="selectedEditionId()"
        (close)="closeModal()"
        (updated)="onDataUpdated()"
      />
    }

    @if (activeModal() === 'gallery') {
      <app-gallery-modal
        [editionId]="selectedEditionId()"
        (close)="closeModal()"
        (updated)="onDataUpdated()"
      />
    }

    @if (activeModal() === 'partners') {
      <app-partners-modal
        [editionId]="selectedEditionId()"
        (close)="closeModal()"
        (updated)="onDataUpdated()"
      />
    }

    @if (activeModal() === 'dp-template') {
      <app-dp-template-modal
        [editionId]="selectedEditionId()"
        (close)="closeModal()"
        (updated)="onDataUpdated()"
      />
    }

    @if (showNewEditionModal()) {
      <app-new-edition-modal
        (close)="showNewEditionModal.set(false)"
        (created)="onNewEditionCreated($event)"
      />
    }
  `,
  styles: `
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in {
      animation: fadeIn 0.25s ease-out forwards;
    }
  `,
})
export class AdminCms implements OnInit, OnDestroy {
  private fs = inject(FirestoreService);

  // Editions state
  availableEditions = signal<string[]>([]);
  selectedEditionId = signal<string>('');
  liveEditionId = signal<string>('');
  isSettingLive = signal(false);
  statusMessage = signal<string | null>(null);

  // Counts & Data for selected edition
  isLoadingModules = signal(true);
  currentEvent = signal<EventDocument | null>(null);
  speakersCount = signal(0);
  agendaCount = signal(0);
  faqCount = signal(0);
  partnersCount = signal(0);
  galleryPhotosCount = signal(0);
  albumsCount = signal(0);

  // Modals state
  activeModal = signal<'config' | 'speakers' | 'agenda' | 'faq' | 'gallery' | 'partners' | 'dp-template' | null>(null);
  showNewEditionModal = signal(false);

  private subs: Subscription = new Subscription();

  ngOnInit(): void {
    // 1. Listen to available editions
    this.subs.add(
      this.fs.getAvailableEditions().subscribe((eds) => {
        if (eds && eds.length > 0) {
          this.availableEditions.set(eds);
        }
      })
    );

    // 2. Listen to current global live edition ID — initialise selectedEdition la première fois
    this.subs.add(
      this.fs.getCurrentEditionId().subscribe((liveId) => {
        this.liveEditionId.set(liveId);
        if (!this.selectedEditionId()) {
          this.selectedEditionId.set(liveId);
          this.loadEditionData(liveId);
        }
      })
    );
  }

  onEditionChange(newEdition: string): void {
    this.selectedEditionId.set(newEdition);
    this.loadEditionData(newEdition);
  }

  loadEditionData(editionId: string): void {
    this.isLoadingModules.set(true);

    const event$ = this.fs.getEvent(editionId);
    const speakers$ = this.fs.getEventCollection<Speaker>(editionId, 'speakers');
    const agenda$ = this.fs.getEventCollection<AgendaItem>(editionId, 'agenda');
    const faq$ = this.fs.getEventCollection<FaqItem>(editionId, 'faq');
    const partners$ = this.fs.getEventCollection<EventPartner>(editionId, 'partners');

    combineLatest([event$, speakers$, agenda$, faq$, partners$]).subscribe({
      next: ([eventDoc, speakersList, agendaList, faqList, partnersList]) => {
        this.currentEvent.set(eventDoc || null);
        this.speakersCount.set(speakersList?.length || 0);
        this.agendaCount.set(agendaList?.length || 0);
        this.faqCount.set(faqList?.length || 0);
        this.partnersCount.set(partnersList?.length || 0);

        const photos = eventDoc?.gallery || [];
        this.galleryPhotosCount.set(photos.length);
        this.albumsCount.set(eventDoc?.albums?.length || 0);

        this.isLoadingModules.set(false);
      },
      error: () => {
        this.isLoadingModules.set(false);
      },
    });
  }

  async setAsLiveEdition(): Promise<void> {
    const targetEdition = this.selectedEditionId();
    if (!targetEdition || this.isSettingLive()) return;
    this.isSettingLive.set(true);

    try {
      await this.fs.saveSiteSettings({ currentEditionId: targetEdition });
      this.liveEditionId.set(targetEdition);
      this.statusMessage.set(`L'édition ${targetEdition} est maintenant active sur le site public !`);
      setTimeout(() => this.statusMessage.set(null), 4000);
    } catch (err: any) {
      alert(err?.message || 'Erreur lors de l\'activation de l\'édition.');
    } finally {
      this.isSettingLive.set(false);
    }
  }

  openModal(modal: 'config' | 'speakers' | 'agenda' | 'faq' | 'gallery' | 'partners' | 'dp-template'): void {
    this.activeModal.set(modal);
  }

  closeModal(): void {
    this.activeModal.set(null);
  }

  onDataUpdated(): void {
    this.loadEditionData(this.selectedEditionId());
  }

  onNewEditionCreated(newEditionId: string): void {
    this.selectedEditionId.set(newEditionId);
    this.loadEditionData(newEditionId);
    this.statusMessage.set(`Nouvelle édition ${newEditionId} créée et sélectionnée.`);
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
export default AdminCms;
