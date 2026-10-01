import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../../../core/auth/services/auth.service';
import { RoleService } from '../../../../../core/auth/services/role.service';
import { UserProfile } from '../../../../../core/auth/models/user-profile.model';

@Component({
  selector: 'app-admin-settings',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6 animate-fade-in">
      <!-- ============================================== -->
      <!-- SECTION 1: CURRENT ADMINISTRATOR PROFILE      -->
      <!-- ============================================== -->
      <div class="bg-white rounded-2xl p-6 sm:p-8 shadow-xs border border-gray-100 transition duration-300">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex items-center gap-4">
            <div class="relative flex-shrink-0">
              @if (userPhotoURL() && !photoLoadError()) {
                <img
                  [src]="userPhotoURL()"
                  [alt]="userDisplayName()"
                  (error)="onPhotoError()"
                  class="w-16 h-16 rounded-full object-cover border-2 border-[#4285F4]/30 shadow-xs"
                  referrerpolicy="no-referrer"
                />
              } @else {
                <div class="w-16 h-16 rounded-full bg-gradient-to-br from-[#4285F4] to-[#1a73e8] text-white flex items-center justify-center font-bold text-xl shadow-xs">
                  {{ getInitials(userDisplayName()) }}
                </div>
              }
              <span class="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-[#34A853] border-2 border-white" title="En ligne"></span>
            </div>

            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <h2 class="text-xl font-bold text-gray-900">
                  {{ userDisplayName() }}
                </h2>
                <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
                  <span class="w-1.5 h-1.5 rounded-full bg-gray-600"></span>
                  Administrateur Principal
                </span>
              </div>
              <p class="text-sm text-gray-500 mt-0.5 flex items-center gap-1.5">
                <svg class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
                {{ userEmail() }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- ============================================== -->
      <!-- SECTION 2: QUICK ADMINISTRATION ACTIONS        -->
      <!-- ============================================== -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Action Card: Add Presenter -->
        <div class="bg-white rounded-2xl p-6 shadow-xs border border-gray-100 flex flex-col justify-between hover:shadow-md transition">
          <div class="space-y-3">
            <div class="w-12 h-12 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
              </svg>
            </div>
            <div>
              <h3 class="text-base font-bold text-gray-900">Ajouter un Présentateur</h3>
              <p class="text-xs text-gray-500 mt-1 leading-relaxed">
                Autorisez un intervenant ou co-animateur à projeter les questions en direct lors des sessions.
              </p>
            </div>
          </div>

          <div class="pt-5">
            <button
              type="button"
              (click)="openAddViewerModal()"
              class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              <span>Nouveau Présentateur</span>
            </button>
          </div>
        </div>

        <!-- Action Card: Transfer Admin -->
        <div class="bg-white rounded-2xl p-6 shadow-xs border border-gray-100 flex flex-col justify-between hover:shadow-md transition">
          <div class="space-y-3">
            <div class="w-12 h-12 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
              </svg>
            </div>
            <div>
              <h3 class="text-base font-bold text-gray-900">Transférer l'Administration</h3>
              <p class="text-xs text-gray-500 mt-1 leading-relaxed">
                Déléguez l'ensemble des privilèges de gestion de l'événement à un autre organisateur.
              </p>
            </div>
          </div>

          <div class="pt-5">
            <button
              type="button"
              (click)="openTransferModal()"
              class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              <svg class="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
              </svg>
              <span>Transférer les droits</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ============================================== -->
      <!-- SECTION 3: ACTIVE PRESENTERS LIST              -->
      <!-- ============================================== -->
      <div class="bg-white rounded-2xl p-6 sm:p-8 shadow-xs border border-gray-100">
        <div class="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
          <div>
            <h3 class="text-base font-bold text-gray-900">Présentateurs Actifs</h3>
            <p class="text-xs text-gray-500">Membres autorisés à accéder au mode projection des questions</p>
          </div>
          <span class="px-2.5 py-1 bg-gray-100 text-gray-800 text-xs font-semibold rounded-full">
            {{ viewers().length }} présentateur(s)
          </span>
        </div>

        @if (viewers().length === 0) {
          <div class="text-center py-8 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 text-gray-500 text-xs">
            Aucun présentateur n'a encore été ajouté.
          </div>
        } @else {
          <div class="divide-y divide-gray-100 border border-gray-200 rounded-2xl overflow-hidden">
            @for (v of viewers(); track v.uid) {
              <div class="flex items-center justify-between p-4 bg-white hover:bg-gray-50/80 transition">
                <div class="flex items-center gap-3 min-w-0">
                  <div class="w-10 h-10 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                    {{ getInitials(v.displayName || v.email) }}
                  </div>
                  <div class="min-w-0">
                    <div class="flex items-center gap-2 flex-wrap">
                      <p class="text-sm font-semibold text-gray-900 truncate">
                        {{ v.displayName || v.email }}
                      </p>
                      @if (v.roomName) {
                        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-gray-100 text-gray-700 border border-gray-200">
                          <svg class="w-3 h-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                          </svg>
                          {{ v.roomName }}
                        </span>
                      }
                    </div>
                    <p class="text-xs text-gray-500 font-mono truncate mt-0.5">
                      {{ v.email }}
                    </p>
                  </div>
                </div>

                <div class="flex items-center gap-3 flex-shrink-0">
                  <button
                    type="button"
                    (click)="openRemoveViewerConfirm(v)"
                    class="px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer border border-red-200"
                    title="Révoquer l'accès"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </div>

    <!-- ============================================== -->
    <!-- MODAL 1: ADD PRESENTER                         -->
    <!-- ============================================== -->
    @if (showAddModal()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fade-in">
        <div class="relative bg-white rounded-3xl w-full max-w-lg min-w-[320px] sm:min-w-[500px] p-6 sm:p-8 shadow-2xl border border-gray-100 animate-pop-in space-y-5 my-auto">
          <!-- Modal Header -->
          <div class="flex items-center pb-3 border-b border-gray-100">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center flex-shrink-0">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
                </svg>
              </div>
              <div>
                <h3 class="text-lg font-bold text-gray-900">Ajouter un Présentateur</h3>
                <p class="text-xs text-gray-500">Accès au mode projection des questions</p>
              </div>
            </div>
          </div>

          <!-- Modal Body Form -->
          <form (ngSubmit)="submitAddViewer()" class="space-y-4">
            <div>
              <label for="modalViewerEmail" class="block text-xs font-semibold text-gray-700 mb-1.5">
                Adresse e-mail Google du présentateur <span class="text-red-500">*</span>
              </label>
              <input
                id="modalViewerEmail"
                type="email"
                name="viewerEmail"
                [(ngModel)]="newViewerEmail"
                placeholder="nom.prenom@gmail.com"
                required
                class="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#4285F4]/40 focus:border-[#4285F4] transition placeholder:text-gray-400"
              />
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label for="modalViewerName" class="block text-xs font-semibold text-gray-700 mb-1.5">
                  Nom de l'intervenant (Optionnel)
                </label>
                <input
                  id="modalViewerName"
                  type="text"
                  name="viewerName"
                  [(ngModel)]="newViewerName"
                  placeholder="Ex: Merlin Lubambo"
                  class="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#4285F4]/40 focus:border-[#4285F4] transition placeholder:text-gray-400"
                />
              </div>

              <div>
                <label for="modalViewerRoom" class="block text-xs font-semibold text-gray-700 mb-1.5">
                  Nom de la Salle (Optionnel)
                </label>
                <input
                  id="modalViewerRoom"
                  type="text"
                  name="viewerRoom"
                  [(ngModel)]="newViewerRoom"
                  placeholder="Ex: Salle A - Grand Amphi"
                  class="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#4285F4]/40 focus:border-[#4285F4] transition placeholder:text-gray-400"
                />
              </div>
            </div>

            @if (viewerErrorMessage()) {
              <div class="text-xs font-semibold text-red-600 bg-red-50 p-3 rounded-xl border border-red-200">
                {{ viewerErrorMessage() }}
              </div>
            }

            <div class="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                (click)="showAddModal.set(false)"
                class="px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition cursor-pointer"
              >
                Annuler
              </button>

              <button
                type="submit"
                [disabled]="!isValidViewerEmail() || isAddingViewer()"
                class="flex items-center gap-2 px-5 py-2.5 bg-[#4285F4] hover:bg-[#3367D6] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl shadow-xs transition cursor-pointer"
              >
                @if (isAddingViewer()) {
                  <svg class="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Ajout en cours...</span>
                } @else {
                  <span>Enregistrer</span>
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    <!-- ============================================== -->
    <!-- MODAL 2: TRANSFER ADMIN CONFIRMATION           -->
    <!-- ============================================== -->
    @if (showTransferModal()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fade-in">
        <div class="relative bg-white rounded-3xl w-full max-w-lg min-w-[320px] sm:min-w-[500px] p-6 sm:p-8 shadow-2xl border border-gray-100 animate-pop-in space-y-6 my-auto">
          <div class="flex items-start gap-4">
            <div class="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
              <svg class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
            </div>
            <div>
              <h3 class="text-xl font-bold text-gray-900">Transférer l'Administration</h3>
              <p class="text-xs text-gray-500 mt-0.5">Transmission des droits d'administration de l'événement</p>
            </div>
          </div>

          <div class="space-y-4">
            <div>
              <label for="newAdminEmailModal" class="block text-xs font-semibold text-gray-700 mb-1.5">
                Nouvelle adresse e-mail Google de l'administrateur <span class="text-red-500">*</span>
              </label>
              <input
                id="newAdminEmailModal"
                type="email"
                name="newAdminEmail"
                [(ngModel)]="newEmail"
                placeholder="nouvel.admin@gmail.com"
                required
                class="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#EA4335]/50 focus:border-[#EA4335] transition placeholder:text-gray-400"
              />
            </div>

            <div class="text-xs text-amber-900 bg-amber-50 p-3.5 rounded-xl border border-amber-200 space-y-1">
              <p class="font-bold">Important :</p>
              <p>Dès confirmation, votre session actuelle sera déconnectée et le nouvel utilisateur aura les droits exclusifs d'administration.</p>
            </div>

            @if (adminTransferError()) {
              <div class="text-xs font-semibold text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                {{ adminTransferError() }}
              </div>
            }
          </div>

          <div class="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
            <button
              type="button"
              (click)="showTransferModal.set(false)"
              [disabled]="isSubmittingTransfer()"
              class="px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="button"
              (click)="confirmTransfer()"
              [disabled]="!isValidEmail() || isSubmittingTransfer()"
              class="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-xl shadow-md transition cursor-pointer"
            >
              @if (isSubmittingTransfer()) {
                <svg class="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Transfert...</span>
              } @else {
                <span>Confirmer le transfert</span>
              }
            </button>
          </div>
        </div>
      </div>
    }

    <!-- ============================================== -->
    <!-- MODAL 3: REMOVE PRESENTER CONFIRMATION         -->
    <!-- ============================================== -->
    @if (viewerToRemove(); as selectedViewer) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fade-in">
        <div class="relative bg-white rounded-3xl w-full max-w-md min-w-[300px] sm:min-w-[420px] p-6 sm:p-8 shadow-2xl border border-gray-100 animate-pop-in space-y-5 my-auto">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </div>
            <div>
              <h3 class="text-lg font-bold text-gray-900">Supprimer ce Présentateur ?</h3>
              <p class="text-xs text-gray-500">Révocation des accès</p>
            </div>
          </div>

          <p class="text-sm text-gray-600 leading-relaxed">
            L'utilisateur <strong class="text-gray-900">{{ selectedViewer.email }}</strong> n'aura plus accès aux fonctions de présentation.
          </p>

          <div class="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
            <button
              type="button"
              (click)="viewerToRemove.set(null)"
              class="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="button"
              (click)="confirmRemoveViewer()"
              class="px-5 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition cursor-pointer"
            >
              Supprimer
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes popIn {
      from { opacity: 0; transform: scale(0.96); }
      to { opacity: 1; transform: scale(1); }
    }
    .animate-fade-in {
      animation: fadeIn 0.2s ease-out forwards;
    }
    .animate-pop-in {
      animation: popIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
  `,
})
export class AdminSettings implements OnInit, OnDestroy {
  private readonly auth = inject(Auth);
  readonly authService = inject(AuthService);
  readonly roles = inject(RoleService);
  readonly router = inject(Router);

  // Photo error fallback state
  photoLoadError = signal(false);

  // Viewers state
  viewers = signal<UserProfile[]>([]);
  private viewersSub?: Subscription;
  newViewerEmail = '';
  newViewerName = '';
  newViewerRoom = '';
  showAddModal = signal(false);
  isAddingViewer = signal(false);
  viewerErrorMessage = signal<string | null>(null);
  viewerToRemove = signal<UserProfile | null>(null);

  // Admin Transfer state
  newEmail = '';
  showTransferModal = signal(false);
  isSubmittingTransfer = signal(false);
  adminTransferError = signal<string | null>(null);

  ngOnInit(): void {
    this.viewersSub = this.roles.getViewers().subscribe((vList) => {
      this.viewers.set(vList);
    });
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
    if (afUser?.email) return afUser.email.split('@')[0];
    if (svcUser?.email) return svcUser.email.split('@')[0];
    return 'Administrateur';
  }

  userEmail(): string {
    return (
      this.auth.currentUser?.email ||
      this.authService.user()?.email ||
      this.roles.profile()?.email ||
      'Compte Google connecté'
    );
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

  getInitials(name?: string | null): string {
    if (!name) return 'A';
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  // --- VIEWER MODAL METHODS ---
  openAddViewerModal(): void {
    this.newViewerEmail = '';
    this.newViewerName = '';
    this.newViewerRoom = '';
    this.viewerErrorMessage.set(null);
    this.showAddModal.set(true);
  }

  isValidViewerEmail(): boolean {
    const email = this.newViewerEmail.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  async submitAddViewer(): Promise<void> {
    if (!this.isValidViewerEmail() || this.isAddingViewer()) return;
    this.isAddingViewer.set(true);
    this.viewerErrorMessage.set(null);

    try {
      await this.roles.addViewer(
        this.newViewerEmail.trim(),
        this.newViewerName.trim(),
        this.newViewerRoom.trim()
      );
      this.newViewerEmail = '';
      this.newViewerName = '';
      this.newViewerRoom = '';
      this.showAddModal.set(false);
    } catch (err: any) {
      this.viewerErrorMessage.set(err?.message || 'Erreur lors de l\'ajout du présentateur.');
    } finally {
      this.isAddingViewer.set(false);
    }
  }

  openRemoveViewerConfirm(viewer: UserProfile): void {
    this.viewerToRemove.set(viewer);
  }

  async confirmRemoveViewer(): Promise<void> {
    const v = this.viewerToRemove();
    if (!v) return;
    try {
      await this.roles.removeViewer(v.uid);
      this.viewerToRemove.set(null);
    } catch {
      this.viewerToRemove.set(null);
    }
  }

  // --- ADMIN TRANSFER METHODS ---
  openTransferModal(): void {
    this.newEmail = '';
    this.adminTransferError.set(null);
    this.showTransferModal.set(true);
  }

  isValidEmail(): boolean {
    const email = this.newEmail.trim().toLowerCase();
    const currentEmail = (this.userEmail() || '').trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email !== currentEmail;
  }

  async confirmTransfer(): Promise<void> {
    if (!this.isValidEmail() || this.isSubmittingTransfer()) return;
    this.isSubmittingTransfer.set(true);
    this.adminTransferError.set(null);

    try {
      await this.roles.transferAdminRole(this.newEmail.trim());
      this.showTransferModal.set(false);
      // Immediately sign out current admin and redirect to home
      await this.authService.signOut();
      await this.router.navigateByUrl('/');
    } catch (error: any) {
      this.adminTransferError.set(
        error?.message || 'Une erreur est survenue lors du transfert de l\'administration.'
      );
    } finally {
      this.isSubmittingTransfer.set(false);
    }
  }

  ngOnDestroy(): void {
    this.viewersSub?.unsubscribe();
  }
}
export default AdminSettings;
