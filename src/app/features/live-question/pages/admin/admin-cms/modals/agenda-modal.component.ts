import { Component, EventEmitter, Input, OnInit, Output, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirestoreService } from '../../../../../../core/firestore/firestore.service';
import { AgendaFormat, AgendaItem } from '../../../../../event/models/agenda-item.model';
import { EventConfigService, FestivalDaySchedule } from '../../../../../event/services/event-config.service';

@Component({
  selector: 'app-agenda-modal',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div class="relative bg-white rounded-3xl w-full max-w-4xl min-w-[320px] shadow-2xl border border-gray-100 animate-pop-in flex flex-col max-h-[90vh] overflow-hidden my-auto">
        
        <!-- Fixed Header -->
        <div class="flex items-center px-6 py-5 border-b border-gray-100 flex-shrink-0 bg-white">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-green-50 text-[#34A853] flex items-center justify-center flex-shrink-0">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
            </div>
            <div>
              <h3 class="text-lg font-bold text-gray-900">Agenda & Planning</h3>
              <p class="text-xs text-gray-500">Édition : {{ editionId }} • {{ agendaItems().length }} créneau(x)</p>
            </div>
          </div>
        </div>

        @if (!showForm()) {
          <div class="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <span class="text-xs text-gray-500">Organisez les sessions, keynotes, ateliers et pauses par journée.</span>
              <button
                type="button"
                (click)="openCreateForm()"
                class="inline-flex items-center gap-2 px-4 py-2 bg-[#34A853] hover:bg-[#2d9248] text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer self-start sm:self-auto"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                </svg>
                <span>Ajouter un créneau</span>
              </button>
            </div>

            <!-- Day Tabs Filter (Multi-day support) -->
            @if (availableDays().length > 1) {
              <div class="flex items-center gap-2 border-b border-gray-100 pb-2 overflow-x-auto">
                <button
                  type="button"
                  (click)="selectedDayFilter.set('all')"
                  class="px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap"
                  [class.bg-gray-900]="selectedDayFilter() === 'all'"
                  [class.text-white]="selectedDayFilter() === 'all'"
                  [class.bg-gray-100]="selectedDayFilter() !== 'all'"
                  [class.text-gray-600]="selectedDayFilter() !== 'all'"
                >
                  Tous les jours ({{ agendaItems().length }})
                </button>

                @for (d of availableDays(); track d.id) {
                  <button
                    type="button"
                    (click)="selectedDayFilter.set(d.id)"
                    class="px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap flex items-center gap-1.5"
                    [class.bg-[#34A853]]="selectedDayFilter() === d.id"
                    [class.text-white]="selectedDayFilter() === d.id"
                    [class.bg-gray-100]="selectedDayFilter() !== d.id"
                    [class.text-gray-600]="selectedDayFilter() !== d.id"
                  >
                    <span>{{ d.name }}</span>
                    @if (d.date) {
                      <span class="text-[10px] opacity-80">({{ d.date }})</span>
                    }
                  </button>
                }
              </div>
            }

            <!-- Loading State -->
            @if (isLoading()) {
              <div class="py-12 text-center text-gray-400 flex flex-col items-center gap-3">
              <svg class="w-8 h-8 animate-spin text-[#34A853]" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span class="text-xs font-semibold">Chargement de l'agenda...</span>
            </div>
          } @else if (filteredAgendaItems().length === 0) {
            <div class="text-center py-12 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 text-gray-500 space-y-3">
              <p class="text-sm font-semibold text-gray-700">Aucun créneau d'agenda configuré</p>
              <p class="text-xs text-gray-400">Cliquez sur « Ajouter un créneau » pour structurer le déroulement de la journée.</p>
            </div>
          } @else {
            <div class="space-y-3">
              @for (item of filteredAgendaItems(); track item.id || item.title) {
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

                        @if (item.dayId) {
                          <span class="text-[10px] font-bold text-gray-600 bg-gray-200/70 px-2 py-0.5 rounded-md uppercase">
                            {{ getDayLabel(item.dayId) }}
                          </span>
                        }

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
        </div>

        <!-- List View Fixed Footer -->
        <div class="flex items-center justify-end px-6 py-4 border-t border-gray-100 flex-shrink-0 bg-white">
          <button
            type="button"
            (click)="close.emit()"
            class="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs sm:text-sm font-semibold rounded-xl transition cursor-pointer"
          >
            Fermer
          </button>
        </div>
      } @else {
        <!-- Agenda Form with Fixed Actions -->
        <form (ngSubmit)="saveItem()" class="flex flex-col flex-1 overflow-hidden min-h-0">
          <div class="p-6 sm:p-8 overflow-y-auto flex-1 space-y-4">
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
                  <option value="conference">Conférence</option>
                  <option value="keynote">Keynote</option>
                  <option value="talk">Talk / Présentation</option>
                  <option value="workshop">Workshop / Atelier</option>
                  <option value="codelab">Codelab</option>
                  <option value="discussion">Panel & Discussion</option>
                  <option value="sponsor">Sponsor</option>
                  <option value="closing">Closing / Clôture</option>
                  <option value="break">Pause / Networking / Lunch</option>
                </select>
              </div>
            </div>

            <!-- Time Inputs with Validation -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label class="block text-xs font-semibold text-gray-700 mb-1">Heure de début *</label>
                <input
                  type="time"
                  name="startsAt"
                  [(ngModel)]="activeItem.startsAt"
                  (ngModelChange)="onTimeChange()"
                  required
                  class="w-full px-3.5 py-2.5 border rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#34A853]/40"
                  [class.border-red-400]="isTimeRangeInvalid()"
                  [class.border-gray-300]="!isTimeRangeInvalid()"
                />
              </div>

              <div>
                <label class="block text-xs font-semibold text-gray-700 mb-1">Heure de fin *</label>
                <input
                  type="time"
                  name="endsAt"
                  [(ngModel)]="activeItem.endsAt"
                  (ngModelChange)="onTimeChange()"
                  required
                  class="w-full px-3.5 py-2.5 border rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#34A853]/40"
                  [class.border-red-400]="isTimeRangeInvalid()"
                  [class.border-gray-300]="!isTimeRangeInvalid()"
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

            <!-- Time validation feedback -->
            @if (isTimeRangeInvalid()) {
              <div class="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs flex items-center gap-2">
                <svg class="w-4 h-4 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span><strong>Erreur horaire :</strong> L'heure de fin doit être postérieure à l'heure de début.</span>
              </div>
            } @else if (calculatedDurationText()) {
              <div class="text-[11px] text-gray-500 flex items-center gap-1.5 px-1">
                <span>⏱️ Durée de la session :</span>
                <strong class="text-gray-800 font-semibold">{{ calculatedDurationText() }}</strong>
              </div>
            }

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
                <label class="block text-xs font-semibold text-gray-700 mb-1">Journée *</label>
                <select
                  name="dayId"
                  [(ngModel)]="activeItem.dayId"
                  (ngModelChange)="onDayChange($event)"
                  class="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#34A853]/40"
                >
                  @for (d of availableDays(); track d.id) {
                    <option [value]="d.id">
                      {{ d.name }} {{ d.date ? '(' + d.date + ')' : '' }}
                    </option>
                  }
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
          </div>

          <!-- Fixed Form Actions Footer -->
          <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0 bg-white">
            <button
              type="button"
              (click)="showForm.set(false)"
              class="px-4 py-2.5 text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition cursor-pointer"
            >
              Annuler
            </button>

            <button
              type="submit"
              [disabled]="isSaving() || isTimeRangeInvalid()"
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
    </div>
  </div>
  `,
})
export class AgendaModalComponent implements OnInit {
  @Input({ required: true }) editionId!: string;
  @Output() close = new EventEmitter<void>();
  @Output() updated = new EventEmitter<void>();

  private fs = inject(FirestoreService);
  private eventConfig = inject(EventConfigService);

  agendaItems = signal<AgendaItem[]>([]);
  availableDays = signal<Array<{ id: string; name: string; date?: string; fullDate?: string }>>([
    { id: 'day1', name: 'Jour 1', date: '29 Nov' },
  ]);
  selectedDayFilter = signal<string>('all');

  isLoading = signal(true);
  showForm = signal(false);
  isEditing = signal(false);
  isSaving = signal(false);
  isTimeRangeInvalid = signal(false);
  calculatedDurationText = signal('');
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

  filteredAgendaItems = computed(() => {
    const filter = this.selectedDayFilter();
    const items = this.agendaItems();
    const filtered = filter === 'all'
      ? items
      : items.filter((it) => (it.dayId || 'day1') === filter);

    return [...filtered].sort((a, b) => {
      if (filter === 'all' && a.dayId !== b.dayId) {
        return (a.dayId || 'day1').localeCompare(b.dayId || 'day1');
      }
      const [ah, am] = (a.startsAt || '00:00').split(':').map((v) => parseInt(v, 10) || 0);
      const [bh, bm] = (b.startsAt || '00:00').split(':').map((v) => parseInt(v, 10) || 0);
      const startDiff = (ah * 60 + am) - (bh * 60 + bm);
      if (startDiff !== 0) return startDiff;
      return (a.endsAt || '').localeCompare(b.endsAt || '');
    });
  });

  ngOnInit(): void {
    this.loadEventDays();
    this.loadAgenda();
  }

  private loadEventDays(): void {
    this.fs.getEvent(this.editionId).subscribe({
      next: (event) => {
        if (event?.agenda?.days && event.agenda.days.length > 0) {
          this.availableDays.set(
            event.agenda.days.map((d) => ({
              id: d.id,
              name: d.name,
              date: d.date,
              fullDate: d.fullDate,
            })),
          );
        } else {
          const days = this.eventConfig.getFestivalDays();
          this.availableDays.set(
            days.map((d) => ({
              id: d.id,
              name: d.name,
              date: d.date,
              fullDate: d.fullDate,
            })),
          );
        }
      },
    });
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

  getDayLabel(dayId: string): string {
    const found = this.availableDays().find((d) => d.id === dayId);
    return found ? found.name : dayId;
  }

  onTimeChange(): void {
    const s = this.activeItem.startsAt;
    const e = this.activeItem.endsAt;

    if (!s || !e) {
      this.isTimeRangeInvalid.set(false);
      this.calculatedDurationText.set('');
      return;
    }

    const [sh, sm] = s.split(':').map((v) => parseInt(v, 10) || 0);
    const [eh, em] = e.split(':').map((v) => parseInt(v, 10) || 0);

    const sMinutes = sh * 60 + sm;
    const eMinutes = eh * 60 + em;

    if (eMinutes <= sMinutes) {
      this.isTimeRangeInvalid.set(true);
      this.calculatedDurationText.set('');
      return;
    }

    this.isTimeRangeInvalid.set(false);
    const diff = eMinutes - sMinutes;
    const hours = Math.floor(diff / 60);
    const mins = diff % 60;

    if (hours > 0 && mins > 0) {
      this.calculatedDurationText.set(`${hours}h ${mins}min (${diff} min)`);
    } else if (hours > 0) {
      this.calculatedDurationText.set(`${hours}h (${diff} min)`);
    } else {
      this.calculatedDurationText.set(`${mins} min`);
    }
  }

  openCreateForm(): void {
    const defaultDay = this.availableDays().length > 0 ? this.availableDays()[0].id : 'day1';
    const { startsAt, endsAt } = this.computeNextAvailableSlot(defaultDay);
    this.activeItem = {
      id: '',
      editionId: this.editionId,
      dayId: defaultDay,
      title: '',
      description: '',
      speakerIds: [],
      startsAt,
      endsAt,
      room: 'Grand Amphi',
      track: 'General',
      format: 'talk',
      isPublished: true,
    };
    this.speakersInput = '';
    this.isEditing.set(false);
    this.feedbackMessage.set(null);
    this.onTimeChange();
    this.showForm.set(true);
  }

  /**
   * Computes the next available start time for a given day,
   * based on the latest endsAt time of existing sessions.
   * Returns start + 45 min duration as a default.
   */
  private computeNextAvailableSlot(dayId: string): { startsAt: string; endsAt: string } {
    const dayItems = this.agendaItems().filter((it) => (it.dayId || 'day1') === dayId);
    const pad = (n: number) => String(n).padStart(2, '0');

    if (dayItems.length === 0) {
      return { startsAt: '09:00', endsAt: '09:45' };
    }

    // Find the latest end time
    let latestEndMinutes = 0;
    for (const item of dayItems) {
      if (item.endsAt) {
        const [h, m] = item.endsAt.split(':').map((v) => parseInt(v, 10) || 0);
        const totalMin = h * 60 + m;
        if (totalMin > latestEndMinutes) latestEndMinutes = totalMin;
      }
    }

    // Suggest start at latest end, clamp to 18:00 max
    const startMin = Math.min(latestEndMinutes, 17 * 60 + 15);
    const endMin = Math.min(startMin + 45, 18 * 60);

    return {
      startsAt: `${pad(Math.floor(startMin / 60))}:${pad(startMin % 60)}`,
      endsAt: `${pad(Math.floor(endMin / 60))}:${pad(endMin % 60)}`,
    };
  }

  onDayChange(dayId: string): void {
    if (!this.isEditing()) {
      const { startsAt, endsAt } = this.computeNextAvailableSlot(dayId);
      this.activeItem.startsAt = startsAt;
      this.activeItem.endsAt = endsAt;
      this.onTimeChange();
    }
  }

  openEditForm(item: AgendaItem): void {
    this.activeItem = { ...item };
    this.speakersInput = (item.speakerIds || []).join(', ');
    this.isEditing.set(true);
    this.feedbackMessage.set(null);
    this.onTimeChange();
    this.showForm.set(true);
  }

  getFormatBadgeClass(format: AgendaFormat | string): string {
    switch (format) {
      case 'conference':
        return 'bg-blue-500 text-white';
      case 'keynote':
        return 'bg-green-500 text-white';
      case 'talk':
        return 'bg-red-500 text-white';
      case 'discussion':
        return 'bg-purple-500 text-white';
      case 'break':
        return 'bg-slate-400 text-white';
      case 'sponsor':
        return 'bg-emerald-500 text-white';
      case 'closing':
        return 'bg-orange-500 text-white';
      case 'workshop':
        return 'bg-amber-500 text-white';
      case 'codelab':
        return 'bg-sky-500 text-white';
      default:
        return 'bg-blue-500 text-white';
    }
  }

  async saveItem(): Promise<void> {
    if (this.isSaving()) return;

    if (!this.activeItem.title?.trim()) {
      this.feedbackType.set('error');
      this.feedbackMessage.set('Veuillez renseigner le titre du créneau au programme.');
      return;
    }

    if (this.isTimeRangeInvalid()) {
      this.feedbackType.set('error');
      this.feedbackMessage.set('L\'heure de fin doit être postérieure à l\'heure de début.');
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
