import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Card } from './session-list/card/card';
import { SessionForm } from './session-form/session-form';
import { AdminSettings } from './admin-settings/admin-settings';
import { AdminCms } from './admin-cms/admin-cms';
import { FirestoreService } from '../../../../core/firestore/firestore.service';
import { Subscription } from 'rxjs';
import { Timestamp } from '@angular/fire/firestore';
import { LiveSession } from '../../models/live-session.model';
import { AuthService } from '../../../../core/auth/auth.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, Card, SessionForm, AdminSettings, AdminCms],
  template: `
    <div class="min-h-screen bg-gray-50/50 py-8 px-4 sm:px-6 lg:px-8">
      <div class="max-w-7xl mx-auto space-y-6">
        <!-- Main Admin Header -->
        <div class="bg-white rounded-2xl p-6 sm:p-8 shadow-xs border border-gray-100">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div class="flex items-center gap-2.5">
                <span class="w-3 h-3 rounded-full bg-[#EA4335] animate-pulse"></span>
                <span class="text-xs font-bold tracking-wider text-[#EA4335] uppercase">
                  Espace d'Administration
                </span>
              </div>
              <h1 class="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1">
                Tableau de Bord Administrateur
              </h1>
              <p class="text-sm text-gray-500 mt-1">
                Gérez les sessions en direct, les contenus du festival et les privilèges d'accès.
              </p>
            </div>

            <!-- Tab Navigation Buttons -->
            <div class="flex items-center bg-gray-100 p-1.5 rounded-xl border border-gray-200/80 self-start md:self-auto flex-wrap gap-1">
              <!-- Tab 1: Sessions Live -->
              <button
                type="button"
                (click)="activeTab.set('sessions')"
                [class.bg-white]="activeTab() === 'sessions'"
                [class.text-gray-900]="activeTab() === 'sessions'"
                [class.shadow-xs]="activeTab() === 'sessions'"
                [class.text-gray-600]="activeTab() !== 'sessions'"
                class="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition cursor-pointer"
              >
                <svg class="w-4 h-4 text-[#4285F4]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                </svg>
                <span>Sessions Live</span>
                <span class="ml-1 px-1.5 py-0.2 bg-blue-100 text-blue-700 rounded-full text-[10px] font-bold">
                  {{ sessions.length }}
                </span>
              </button>

              <!-- Tab 2: Module CMS -->
              <button
                type="button"
                (click)="activeTab.set('cms')"
                [class.bg-white]="activeTab() === 'cms'"
                [class.text-gray-900]="activeTab() === 'cms'"
                [class.shadow-xs]="activeTab() === 'cms'"
                [class.text-gray-600]="activeTab() !== 'cms'"
                class="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition cursor-pointer"
              >
                <svg class="w-4 h-4 text-[#34A853]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z"/>
                </svg>
                <span>Gestion Contenus (CMS)</span>
              </button>

              <!-- Tab 3: Paramètres & Admin -->
              <button
                type="button"
                (click)="activeTab.set('settings')"
                [class.bg-white]="activeTab() === 'settings'"
                [class.text-gray-900]="activeTab() === 'settings'"
                [class.shadow-xs]="activeTab() === 'settings'"
                [class.text-gray-600]="activeTab() !== 'settings'"
                class="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition cursor-pointer"
              >
                <svg class="w-4 h-4 text-[#EA4335]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                <span>Paramètres & Équipe</span>
              </button>
            </div>
          </div>
        </div>

        <!-- TAB 1: SESSIONS LIVE -->
        @if (activeTab() === 'sessions') {
          <div class="space-y-6">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 class="text-lg font-bold text-gray-900">Liste des Sessions Actives & Prévues</h2>
                <p class="text-xs text-gray-500">Activez ou désactivez une session pour ouvrir les questions au public.</p>
              </div>

              <button
                type="button"
                (click)="openForm()"
                class="flex items-center gap-2 bg-[#4285F4] hover:bg-[#3367D6] text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-xs hover:shadow-md transition cursor-pointer self-start sm:self-auto"
              >
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                </svg>
                <span>Ajouter une session</span>
              </button>
            </div>

            @if (sessions.length === 0) {
              <div class="bg-white rounded-2xl p-12 text-center border border-gray-100 space-y-4">
                <div class="w-16 h-16 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mx-auto">
                  <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                  </svg>
                </div>
                <div>
                  <h3 class="text-base font-bold text-gray-900">Aucune session configurée</h3>
                  <p class="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                    Créez votre première session live pour permettre aux participants de poser des questions.
                  </p>
                </div>
                <button
                  type="button"
                  (click)="openForm()"
                  class="inline-flex items-center gap-2 bg-[#4285F4] text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-blue-600 transition cursor-pointer"
                >
                  Ajouter une session maintenant
                </button>
              </div>
            } @else {
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                @for (session of sessions; track session.id || $index) {
                  <app-card
                    [session]="session"
                    (viewSession)="onViewSession($event)"
                    (toggleStatus)="onToggleStatus($event)"
                  >
                  </app-card>
                }
              </div>
            }
          </div>
        }

        <!-- TAB 2: CMS MODULE -->
        @if (activeTab() === 'cms') {
          <app-admin-cms />
        }

        <!-- TAB 3: SETTINGS & TEAM -->
        @if (activeTab() === 'settings') {
          <app-admin-settings />
        }
      </div>
    </div>

    <!-- Session Form Modal for Create / Edit -->
    @if (showForm) {
      <app-session-form
        [sessionToEdit]="selectedSession"
        (closed)="onFormClosed()"
      ></app-session-form>
    }
  `,
  styles: ``,
})
export default class AdminComponent implements OnInit, OnDestroy {
  readonly auth = inject(AuthService);
  private fs = inject(FirestoreService);

  activeTab = signal<'sessions' | 'cms' | 'settings'>('sessions');
  showForm = false;
  selectedSession?: any;
  sessions: LiveSession<Timestamp>[] = [];
  sessionsLoading = signal(true);
  speakersSub!: Subscription;

  ngOnInit(): void {
    this.sessionsLoading.set(true);
    this.speakersSub = this.fs.getSessions().subscribe((sessions: any) => {
      this.sessions = sessions || [];
      this.sessionsLoading.set(false);
    });
  }

  onViewSession(session: LiveSession<Timestamp>) {
    console.log('View session:', session);
  }

  onToggleStatus(sessionId: string) {
    const session = this.sessions.find((s) => s.id === sessionId);
    if (session) {
      session.isActive = !session.isActive;
    }
  }

  openForm() {
    this.selectedSession = undefined;
    this.showForm = true;
  }

  onFormClosed() {
    this.showForm = false;
    this.selectedSession = undefined;
  }

  ngOnDestroy(): void {
    if (this.speakersSub) {
      this.speakersSub.unsubscribe();
    }
  }
}

