import { Component, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirestoreService } from '../../../../../../core/firestore/firestore.service';
import { DpTemplateConfig } from '../../../../../event/models/event.model';

@Component({
  selector: 'app-dp-template-modal',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div class="relative bg-white rounded-3xl w-full max-w-3xl min-w-[320px] shadow-2xl border border-gray-100 animate-pop-in flex flex-col max-h-[90vh] overflow-hidden my-auto">
        
        <!-- Fixed Header -->
        <div class="flex items-center px-6 py-5 border-b border-gray-100 flex-shrink-0 bg-white">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-red-50 text-[#EA4335] flex items-center justify-center flex-shrink-0">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
            </div>
            <div>
              <h3 class="text-lg font-bold text-gray-900">Design & Templates du Générateur DP</h3>
              <p class="text-xs text-gray-500">Édition : {{ editionId }} • Personnalisation des badges avatars</p>
            </div>
          </div>
        </div>

        @if (isLoading()) {
          <div class="py-16 text-center text-gray-400 flex flex-col items-center justify-center flex-1 gap-3">
            <svg class="w-8 h-8 animate-spin text-[#EA4335]" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span class="text-xs font-semibold">Chargement des paramètres DP...</span>
          </div>
        } @else {
          <form (ngSubmit)="saveTemplate()" class="flex flex-col flex-1 overflow-hidden min-h-0">
            <div class="p-6 sm:p-8 overflow-y-auto flex-1 space-y-5">
            <!-- Frame & Theme Colors -->
            <div class="space-y-4">
              <h4 class="text-xs font-bold uppercase tracking-wider text-gray-400">Habillage & Couleurs du Badge</h4>
              
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-semibold text-gray-700 mb-1">Image du Cadre / Overlay (URL)</label>
                  <input
                    type="text"
                    name="frameUrl"
                    [(ngModel)]="config.frameUrl"
                    placeholder="assets/dp-layout.png ou https://..."
                    class="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#EA4335]/40"
                  />
                  <p class="text-[11px] text-gray-400 mt-1">Image transparente PNG superposée sur la photo de profil.</p>
                </div>

                <div>
                  <label class="block text-xs font-semibold text-gray-700 mb-1">Thème de Couleur Principal</label>
                  <select
                    name="theme"
                    [(ngModel)]="config.theme"
                    class="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#EA4335]/40"
                  >
                    <option value="yellow">Jaune Google (#FBBC04)</option>
                    <option value="blue">Bleu Google (#4285F4)</option>
                    <option value="green">Vert Google (#34A853)</option>
                    <option value="red">Rouge Google (#EA4335)</option>
                    <option value="default">Par défaut (Sombre / DevFest)</option>
                    <option value="white">Minimaliste Clair (Blanc)</option>
                  </select>
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-semibold text-gray-700 mb-1">Hashtag de l'Événement</label>
                  <input
                    type="text"
                    name="hashtag"
                    [(ngModel)]="config.hashtag"
                    placeholder="#DevFestKivu2025 #GDGKivu"
                    class="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#EA4335]/40"
                  />
                </div>

                <div>
                  <label class="block text-xs font-semibold text-gray-700 mb-1">Citation par défaut</label>
                  <input
                    type="text"
                    name="defaultQuote"
                    [(ngModel)]="config.defaultQuote"
                    placeholder="DevFest Kivu, j'arrive !"
                    class="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#EA4335]/40"
                  />
                </div>
              </div>
            </div>

            <!-- Suggested Quotes List -->
            <div class="space-y-3 pt-3 border-t border-gray-100">
              <div class="flex items-center justify-between">
                <h4 class="text-xs font-bold uppercase tracking-wider text-gray-400">Suggestions de Citations</h4>
                <span class="text-xs text-gray-500 font-semibold">{{ (config.suggestedQuotes || []).length }} citation(s)</span>
              </div>

              <div class="flex gap-2">
                <input
                  type="text"
                  [(ngModel)]="newQuoteInput"
                  name="newQuoteInput"
                  placeholder="Ex: Building the future, one line at a time."
                  class="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#EA4335]/40"
                />
                <button
                  type="button"
                  (click)="addQuote()"
                  [disabled]="!newQuoteInput.trim()"
                  class="px-4 py-2 bg-gray-900 hover:bg-black disabled:bg-gray-300 text-white rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer"
                >
                  + Ajouter
                </button>
              </div>

              <div class="space-y-2 max-h-40 overflow-y-auto">
                @for (q of (config.suggestedQuotes || []); track $index) {
                  <div class="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-200/80 text-xs">
                    <span class="text-gray-800 truncate pr-2">"{{ q }}"</span>
                    <button
                      type="button"
                      (click)="removeQuote($index)"
                      class="text-red-600 hover:bg-red-50 p-1 rounded transition cursor-pointer flex-shrink-0"
                      title="Supprimer cette citation"
                    >
                      ✕
                    </button>
                  </div>
                }
              </div>
            </div>

            @if (feedbackMessage()) {
              <div
                class="text-xs p-3 rounded-xl border flex items-center gap-2"
                [class.bg-green-50]="feedbackType() === 'success'"
                [class.text-green-800]="feedbackType() === 'success'"
                [class.border-green-200]="feedbackType() === 'success'"
                [class.bg-red-50]="feedbackType() === 'error'"
                [class.text-red-800]="feedbackType() === 'error'"
                [class.border-red-200]="feedbackType() === 'error'"
              >
                <span>{{ feedbackMessage() }}</span>
              </div>
            }
            </div>

            <!-- Fixed Footer Actions -->
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
                [disabled]="isSaving()"
                class="flex items-center gap-2 px-5 py-2.5 bg-[#EA4335] hover:bg-[#d3382b] disabled:bg-gray-300 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition cursor-pointer"
              >
                @if (isSaving()) {
                  <svg class="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Enregistrement...</span>
                } @else {
                  <span>Enregistrer le template</span>
                }
              </button>
            </div>
          </form>
        }
      </div>
    </div>
  `,
})
export class DpTemplateModalComponent implements OnInit {
  @Input({ required: true }) editionId!: string;
  @Output() close = new EventEmitter<void>();
  @Output() updated = new EventEmitter<void>();

  private fs = inject(FirestoreService);

  isLoading = signal(true);
  isSaving = signal(false);
  feedbackMessage = signal<string | null>(null);
  feedbackType = signal<'success' | 'error'>('success');
  newQuoteInput = '';

  config: DpTemplateConfig = {
    frameUrl: 'assets/dp-layout.png',
    theme: 'yellow',
    badgeLayout: 'classic',
    defaultQuote: "DevFest Kivu, j'arrive !",
    hashtag: '#DevFestKivu #GDGKivu',
    suggestedQuotes: [
      'Coder est ma passion.',
      "DevFest Kivu, j'arrive !",
      'Prêt à networker et innover.',
      'Talk is cheap. Show me the code.',
      'Building the future, one line at a time.',
    ],
  };

  ngOnInit(): void {
    this.loadTemplateConfig();
  }

  private loadTemplateConfig(): void {
    this.isLoading.set(true);
    this.fs.getEvent(this.editionId).subscribe({
      next: (event) => {
        if (event?.dpTemplate) {
          this.config = {
            ...this.config,
            ...event.dpTemplate,
            suggestedQuotes: event.dpTemplate.suggestedQuotes || this.config.suggestedQuotes,
          };
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  addQuote(): void {
    if (!this.newQuoteInput.trim()) {
      this.feedbackType.set('error');
      this.feedbackMessage.set('Veuillez saisir une citation avant de l\'ajouter.');
      return;
    }
    this.config.suggestedQuotes = [...(this.config.suggestedQuotes || []), this.newQuoteInput.trim()];
    this.newQuoteInput = '';
    this.feedbackMessage.set(null);
  }

  removeQuote(index: number): void {
    this.config.suggestedQuotes = (this.config.suggestedQuotes || []).filter((_, i) => i !== index);
  }

  async saveTemplate(): Promise<void> {
    if (this.isSaving()) return;
    this.isSaving.set(true);
    this.feedbackMessage.set(null);

    try {
      await this.fs.saveEvent(this.editionId, {
        dpTemplate: this.config,
      });

      this.feedbackType.set('success');
      this.feedbackMessage.set('Modèle de badge personnalisé sauvegardé avec succès !');
      this.updated.emit();

      setTimeout(() => {
        this.close.emit();
      }, 1200);
    } catch (err: any) {
      this.feedbackType.set('error');
      this.feedbackMessage.set(err?.message || 'Erreur lors de la sauvegarde.');
    } finally {
      this.isSaving.set(false);
    }
  }
}
