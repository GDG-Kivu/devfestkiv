import { Component, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirestoreService } from '../../../../../../core/firestore/firestore.service';
import { AgendaFormat, AgendaItem } from '../../../../../event/models/agenda-item.model';

@Component({
  selector: 'app-agenda-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div class="relative bg-white rounded-3xl w-full max-w-4xl min-w-[320px] p-6 sm:p-8 shadow-2xl border border-gray-100 animate-pop-in space-y-6 my-auto max-h-[90vh] overflow-y-auto">
        
        <!-- Header -->
        <div class="flex items-center justify-between pb-4 border-b border-gray-100">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-green-50 text-[#34A853] flex items-center justify-center flex-shrink-0">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
            </div>
            <div>
              <h3 class="text-lg font-bold text-gray-900">Agenda & Planning du Festival</h3>
              <p class="text-xs text-gray-500">Édition : {{ editionId }} • {{ agendaItems().length }} créneau(x)</p>
            </div>
          </div>
          <button
            type="button"
            (click)="close.emit()"
            class="text-gray-400 hover:text-gray-700 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition cursor-pointer text-base font-bold"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        @if (!showForm()) {
          <div class="flex items-center justify-between gap-4">
            <span class="text-xs text-gray-500">Organisez les sessions, keynotes, ateliers et pauses.</span>
            <button
              type="button"
              (click)="openCreateForm()"
              class="inline-flex items-center gap-2 px-4 py-2 bg-[#34A853] hover:bg-[#2d9248] text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              <span>Ajouter un créneau</span>
            </button>
          </div>

          <!-- Loading State -->
          @if (isLoading()) {
            <div class="py-12 text-center text-gray-400 flex flex-col items-center gap-3">
              <svg class="w-8 h-8 animate-spin text-[#34A853]" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span class="text-xs font-semibold">Chargement de l'agenda...</span>
            </div>
          } @else if (agendaItems().length === 0) {
            <div class="text-center py-12 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 text-gray-500 space-y-3">
              <p class="text-sm font-semibold text-gray-700">Aucun créneau d'agenda configuré</p>
              <p class="text-xs text-gray-400">Cliquez sur « Ajouter un créneau » pour structurer le déroulement de la journée.</p>
            </div>
          } @else {
            <div class="space-y-3">
              @for (item of agendaItems(); track item.id || item.title) {
                <div class="bg-gray-50/70 hover:bg-gray-50 rounded-2xl p-4 border border-gray-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition">
                  <div class="flex items-start gap-3.5 min-w-0">
                    <div class="px-2.5 py-1.5 rounded-xl bg-white border border-gray-200 font-mono text-xs font-bold text-gray-700 whitespace-nowrap shadow-2xs">
                      {{ item.startsAt }} - {{ item.endsAt }}
                    </div>

                    <div class="min-w-0 space-y-1">
                      <div class="flex items-center gap-2 flex-wrap">
                        <h4 class="text-sm font-bold text-gray-900 truncate">{{ item.title }}</h4>
                        <span class="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase" [class]="getFormatBadgeClass(item.format)">
                          {{ item.format }}
                        </span>
                        @if (item.room) {
                          <span class="text-[11px] text-gray-500 bg-white border border-gray-200 px-2 py-0.5 rounded-md">
                            📍 {{ item.room }}
                          </span>
                        }
                      </div>

                      @if (item.description) {
                        <p class="text-xs text-gray-500 line-clamp-1">{{ item.description }}</p>
                      }

                      @if (item.speakerIds && item.speakerIds.length > 0) {
                        <p class="text-xs text-[#4285F4] font-medium">🎤 {{ item.speakerIds.join(', ') }}</p>
                      }
                    </div>
                  </div>

                  <div class="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
                    <button
                      type="button"
                      (click)="openEditForm(item)"
                      class="px-3 py-1.5 text-xs font-semibold text-[#34A853] hover:bg-green-50 rounded-lg transition cursor-pointer"
                    >
                      Modifier
                    </button>
                    <button
                      type="button"
                      (click)="deleteItem(item)"
                      class="px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              }
            </div>
          }
        } @else {
          <!-- Agenda Form -->
          <form (ngSubmit)="saveItem()" class="space-y-4">
            <div class="flex items-center justify-between pb-2 border-b border-gray-100">
              <h4 class="text-sm font-bold text-gray-900">
                @if (isEditing()) {
                  Modifier le créneau d'agenda
                } @else {
                  Nouveau créneau au programme
                }
              </h4>
              <button
                type="button"
                (click)="showForm.set(false)"
                class="text-xs text-gray-500 hover:text-gray-800 font-semibold cursor-pointer"
              >
                ← Retour au planning
              </button>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold text-gray-700 mb-1">Titre de la session *</label>
                <input
                  type="text"
                  name="title"
                  [(ngModel)]="activeItem.title"
                  required
                  placeholder="Ex: Keynote d'ouverture & Bienvenue"
                  class="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#34A853]/40"
                />
              </div>

              <div>
                <label class="block text-xs font-semibold text-gray-700 mb-1">Format de la session</label>
                <select
                  name="format"
                  [(ngModel)]="activeItem.format"
                  class="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#34A853]/40"
                >
                  <option value="keynote">Keynote</option>
                  <option value="talk">Talk / Présentation</option>
                  <option value="workshop">Workshop / Atelier</option>
                  <option value="codelab">Codelab</option>
                  <option value="discussion">Panel & Discussion</option>
                  <option value="break">Pause / Networking / Lunch</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label class="block text-xs font-semibold text-gray-700 mb-1">Heure de début *</label>
                <input
                  type="text"
                  name="startsAt"
                  [(ngModel)]="activeItem.startsAt"
                  required
                  placeholder="Ex: 11:00"
                  class="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#34A853]/40"
                />
              </div>

              <div>
                <label class="block text-xs font-semibold text-gray-700 mb-1">Heure de fin *</label>
                <input
                  type="text"
                  name="endsAt"
                  [(ngModel)]="activeItem.endsAt"
                  required
                  placeholder="Ex: 11:45"
                  class="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#34A853]/40"
                />
              </div>

              <div>
                <label class="block text-xs font-semibold text-gray-700 mb-1">Salle / Emplacement</label>
                <input
                  type="text"
                  name="room"
                  [(ngModel)]="activeItem.room"
                  placeholder="Ex: Grand Amphi / Salle A"
                  class="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#34A853]/40"
                />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold text-gray-700 mb-1">Intervenants (séparés par des virgules)</label>
                <input
                  type="text"
                  name="speakersString"
                  [(ngModel)]="speakersInput"
                  placeholder="Ex: Daniella Ansima, Yannick S."
                  class="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#34A853]/40"
                />
              </div>

              <div>
                <label class="block text-xs font-semibold text-gray-700 mb-1">Journée / Track</label>
                <select
                  name="dayId"
                  [(ngModel)]="activeItem.dayId"
                  class="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#34A853]/40"
                >
                  <option value="day1">Jour 1</option>
                  <option value="day2">Jour 2</option>
                </select>
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1">Description du créneau</label>
              <textarea
                name="description"
                rows="3"
                [(ngModel)]="activeItem.description"
                placeholder="Détails sur le contenu abordé..."
                class="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#34A853]/40 resize-none"
              ></textarea>
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

            <div class="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                (click)="showForm.set(false)"
                class="px-4 py-2.5 text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition cursor-pointer"
              >
                Annuler
              </button>

              <button
                type="submit"
                [disabled]="isSaving()"
                class="flex items-center gap-2 px-5 py-2.5 bg-[#34A853] hover:bg-[#2d9248] disabled:bg-gray-300 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition cursor-pointer"
              >
                @if (isSaving()) {
                  <svg class="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Enregistrement...</span>
                } @else {
                  <span>{{ isEditing() ? 'Mettre à jour' : 'Ajouter le créneau' }}</span>
                }
              </button>
            </div>
          </form>
        }

        <div class="flex items-center justify-end pt-4 border-t border-gray-100">
          <button
            type="button"
            (click)="close.emit()"
            class="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs sm:text-sm font-semibold rounded-xl transition cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  `,
})
export class AgendaModalComponent implements OnInit {
  @Input({ required: true }) editionId!: string;
  @Output() close = new EventEmitter<void>();
  @Output() updated = new EventEmitter<void>();

  private fs = inject(FirestoreService);

  agendaItems = signal<AgendaItem[]>([]);
  isLoading = signal(true);
  showForm = signal(false);
  isEditing = signal(false);
  isSaving = signal(false);
  feedbackMessage = signal<string | null>(null);
  feedbackType = signal<'success' | 'error'>('success');
  speakersInput = '';

  activeItem: AgendaItem = {
    id: '',
    editionId: '',
    dayId: 'day1',
    title: '',
    description: '',
    speakerIds: [],
    startsAt: '10:00',
    endsAt: '10:30',
    room: '',
    track: 'General',
    format: 'talk',
    isPublished: true,
  };

  ngOnInit(): void {
    this.loadAgenda();
  }

  private loadAgenda(): void {
    this.isLoading.set(true);
    this.fs.getEventCollection<AgendaItem>(this.editionId, 'agenda').subscribe({
      next: (list) => {
        this.agendaItems.set(list || []);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  openCreateForm(): void {
    this.activeItem = {
      id: '',
      editionId: this.editionId,
      dayId: 'day1',
      title: '',
      description: '',
      speakerIds: [],
      startsAt: '10:00',
      endsAt: '10:30',
      room: 'Grand Amphi',
      track: 'General',
      format: 'talk',
      isPublished: true,
    };
    this.speakersInput = '';
    this.isEditing.set(false);
    this.feedbackMessage.set(null);
    this.showForm.set(true);
  }

  openEditForm(item: AgendaItem): void {
    this.activeItem = { ...item };
    this.speakersInput = (item.speakerIds || []).join(', ');
    this.isEditing.set(true);
    this.feedbackMessage.set(null);
    this.showForm.set(true);
  }

  getFormatBadgeClass(format: AgendaFormat): string {
    switch (format) {
      case 'keynote':
        return 'bg-blue-100 text-blue-800';
      case 'workshop':
        return 'bg-amber-100 text-amber-800';
      case 'break':
        return 'bg-gray-100 text-gray-700';
      case 'discussion':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  }

  async saveItem(): Promise<void> {
    if (this.isSaving()) return;

    if (!this.activeItem.title?.trim()) {
      this.feedbackType.set('error');
      this.feedbackMessage.set('Veuillez renseigner le titre du créneau au programme.');
      return;
    }

    this.isSaving.set(true);
    this.feedbackMessage.set(null);

    try {
      this.activeItem.editionId = this.editionId;
      this.activeItem.speakerIds = this.speakersInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      if (this.isEditing() && this.activeItem.id) {
        await this.fs.saveEventDocument(this.editionId, 'agenda', this.activeItem);
      } else {
        const id = await this.fs.createEventDocument(this.editionId, 'agenda', this.activeItem);
        this.activeItem.id = id;
      }

      this.feedbackType.set('success');
      this.feedbackMessage.set('Créneau d\'agenda enregistré avec succès !');
      this.updated.emit();

      setTimeout(() => {
        this.showForm.set(false);
      }, 1000);
    } catch (err: any) {
      this.feedbackType.set('error');
      this.feedbackMessage.set(err?.message || 'Erreur lors de l\'enregistrement.');
    } finally {
      this.isSaving.set(false);
    }
  }

  async deleteItem(item: AgendaItem): Promise<void> {
    if (!item.id) return;
    if (!confirm(`Supprimer le créneau "${item.title}" ?`)) return;

    try {
      await this.fs.deleteEventDocument(this.editionId, 'agenda', item.id);
      this.updated.emit();
    } catch (err: any) {
      alert(err?.message || 'Erreur lors de la suppression.');
    }
  }
}
