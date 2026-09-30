import { Component, EventEmitter, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirestoreService } from '../../../../../../core/firestore/firestore.service';

@Component({
  selector: 'app-new-edition-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div class="relative bg-white rounded-3xl w-full max-w-lg min-w-[320px] shadow-2xl border border-gray-100 animate-pop-in flex flex-col max-h-[90vh] overflow-hidden my-auto">
        
        <!-- Fixed Header -->
        <div class="flex items-center px-6 py-5 border-b border-gray-100 flex-shrink-0 bg-white">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-blue-50 text-[#4285F4] flex items-center justify-center flex-shrink-0">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
            </div>
            <div>
              <h3 class="text-lg font-bold text-gray-900">Nouvelle Édition du Festival</h3>
              <p class="text-xs text-gray-500">Créez une nouvelle édition pour piloter ses contenus</p>
            </div>
          </div>
        </div>

        <form (ngSubmit)="submitNewEdition()" class="flex flex-col flex-1 overflow-hidden min-h-0">
          <div class="p-6 sm:p-8 overflow-y-auto flex-1 space-y-4">
            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1">Identifiant de l'Édition (Année) *</label>
              <input
                type="text"
                name="editionId"
                [(ngModel)]="editionId"
                required
                placeholder="Ex: 2026"
                class="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4285F4]/40"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1">Nom Complet de l'Événement</label>
              <input
                type="text"
                name="fullName"
                [(ngModel)]="fullName"
                placeholder="Ex: DevFest Kivu 2026"
                class="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4285F4]/40"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1">Thème de l'Édition</label>
              <input
                type="text"
                name="theme"
                [(ngModel)]="theme"
                placeholder="Ex: AI & Beyond"
                class="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4285F4]/40"
              />
            </div>

            <div class="flex items-center gap-3 pt-2">
              <input
                type="checkbox"
                id="setAsActive"
                name="setAsActive"
                [(ngModel)]="setAsActive"
                class="w-4 h-4 text-[#4285F4] rounded border-gray-300 focus:ring-[#4285F4]"
              />
              <label for="setAsActive" class="text-xs font-semibold text-gray-700 cursor-pointer">
                Définir immédiatement comme édition active du site public
              </label>
            </div>

            @if (errorMessage()) {
              <div class="text-xs font-semibold text-red-600 bg-red-50 p-3 rounded-xl border border-red-200">
                {{ errorMessage() }}
              </div>
            }
          </div>

          <!-- Fixed Footer -->
          <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0 bg-white">
            <button
              type="button"
              (click)="close.emit()"
              class="px-4 py-2.5 text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition cursor-pointer"
            >
              Annuler
            </button>

            <button
              type="submit"
              [disabled]="isSubmitting()"
              class="flex items-center gap-2 px-5 py-2.5 bg-[#4285F4] hover:bg-[#3367D6] disabled:bg-gray-300 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition cursor-pointer"
            >
              @if (isSubmitting()) {
                <svg class="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Création...</span>
              } @else {
                <span>Créer l'édition</span>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class NewEditionModalComponent {
  @Output() close = new EventEmitter<void>();
  @Output() created = new EventEmitter<string>();

  private fs = inject(FirestoreService);

  editionId = '';
  fullName = '';
  theme = 'Innovation & Tech';
  setAsActive = false;
  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);

  async submitNewEdition(): Promise<void> {
    const id = this.editionId.trim();
    if (this.isSubmitting()) return;

    if (!id) {
      this.errorMessage.set('Veuillez renseigner un identifiant ou une année pour l\'édition (ex: 2026).');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    try {
      const year = parseInt(id, 10) || new Date().getFullYear();
      await this.fs.createEdition(id, {
        fullName: this.fullName.trim() || `DevFest Kivu ${id}`,
        theme: this.theme.trim(),
        year,
      });

      if (this.setAsActive) {
        await this.fs.saveSiteSettings({ currentEditionId: id });
      }

      this.created.emit(id);
      this.close.emit();
    } catch (err: any) {
      this.errorMessage.set(err?.message || 'Erreur lors de la création de l\'édition.');
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
