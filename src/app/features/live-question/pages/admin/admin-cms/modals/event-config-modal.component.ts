import { Component, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirestoreService } from '../../../../../../core/firestore/firestore.service';
import { EventDocument } from '../../../../../event/models/event.model';
import { EVENT_CONFIG } from '../../../../../../config/event.config';

const FRENCH_MONTHS = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
];

const FRENCH_DAYS = [
  'Dimanche',
  'Lundi',
  'Mardi',
  'Mercredi',
  'Jeudi',
  'Vendredi',
  'Samedi',
];

@Component({
  selector: 'app-event-config-modal',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div class="relative bg-white rounded-3xl w-full max-w-3xl min-w-[320px] shadow-2xl border border-gray-100 animate-pop-in flex flex-col max-h-[90vh] overflow-hidden my-auto">
        
        <!-- Fixed Header -->
        <div class="flex items-center px-6 py-5 border-b border-gray-100 flex-shrink-0 bg-white">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-blue-50 text-[#4285F4] flex items-center justify-center flex-shrink-0">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
            </div>
            <div>
              <h3 class="text-lg font-bold text-gray-900">Configuration Globale de l'Événement</h3>
              <p class="text-xs text-gray-500">Édition : {{ editionId }}</p>
            </div>
          </div>
        </div>

        @if (isLoading()) {
          <div class="py-16 text-center text-gray-400 flex flex-col items-center justify-center flex-1 gap-3">
            <svg class="w-8 h-8 animate-spin text-[#4285F4]" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span class="text-xs font-semibold">Chargement des données...</span>
          </div>
        } @else {
          <!-- Form with scrollable body & fixed footer -->
          <form (ngSubmit)="saveConfig()" class="flex flex-col flex-1 overflow-hidden min-h-0">
            <div class="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6">
            
            <!-- General Info -->
            <div class="space-y-4">
              <h4 class="text-xs font-bold uppercase tracking-wider text-gray-400">Informations Générales</h4>
              
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-semibold text-gray-700 mb-1">Nom Court *</label>
                  <input
                    type="text"
                    name="name"
                    [(ngModel)]="formData.name"
                    required
                    placeholder="DevFest Kivu"
                    class="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#4285F4]/40"
                  />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-700 mb-1">Nom Complet *</label>
                  <input
                    type="text"
                    name="fullName"
                    [(ngModel)]="formData.fullName"
                    required
                    placeholder="DevFest Kivu 2025"
                    class="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#4285F4]/40"
                  />
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-semibold text-gray-700 mb-1">Thème de l'Édition</label>
                  <input
                    type="text"
                    name="theme"
                    [(ngModel)]="formData.theme"
                    placeholder="Innovation & Tech"
                    class="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#4285F4]/40"
                  />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-700 mb-1">Lien d'Inscription (RSVP / Billetterie)</label>
                  <input
                    type="url"
                    name="registrationUrl"
                    [(ngModel)]="formData.registrationUrl"
                    placeholder="https://gdg.community.dev/..."
                    class="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#4285F4]/40"
                  />
                </div>
              </div>

              <div>
                <label class="block text-xs font-semibold text-gray-700 mb-1">Description de l'Événement</label>
                <textarea
                  name="description"
                  rows="3"
                  [(ngModel)]="formData.description"
                  placeholder="Présentation générale du festival..."
                  class="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#4285F4]/40 resize-none"
                ></textarea>
              </div>
            </div>

            <!-- Venue Info -->
            <div class="space-y-4 pt-2 border-t border-gray-100">
              <h4 class="text-xs font-bold uppercase tracking-wider text-gray-400">Lieu & Emplacement</h4>
              
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-semibold text-gray-700 mb-1">Centre de Conférence / Salle</label>
                  <input
                    type="text"
                    name="conferenceCenter"
                    [(ngModel)]="formData.venue.conferenceCenter"
                    placeholder="Hotel Panorama Bukavu"
                    class="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#4285F4]/40"
                  />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-700 mb-1">Ville & Pays</label>
                  <input
                    type="text"
                    name="fullLocation"
                    [(ngModel)]="formData.venue.fullLocation"
                    placeholder="Bukavu, RD Congo"
                    class="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#4285F4]/40"
                  />
                </div>
              </div>
            </div>

            <!-- Dates & Programme -->
            <div class="space-y-4 pt-2 border-t border-gray-100">
              <div class="flex items-center justify-between">
                <h4 class="text-xs font-bold uppercase tracking-wider text-gray-400">Dates & Programme</h4>
                @if (calculatedDaysCount() > 0) {
                  <span class="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-[#4285F4] border border-blue-200">
                    {{ calculatedDaysCount() }} {{ calculatedDaysCount() === 1 ? 'journée' : 'journées' }}
                  </span>
                }
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-semibold text-gray-700 mb-1">Ouverture *</label>
                  <input
                    type="datetime-local"
                    name="startDateTime"
                    [(ngModel)]="startDateTimeInput"
                    (ngModelChange)="onDateInputsChange()"
                    required
                    class="w-full px-3.5 py-2.5 border rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#4285F4]/40 transition"
                    [class.border-red-400]="isDateRangeInvalid()"
                    [class.border-gray-300]="!isDateRangeInvalid()"
                  />
                </div>

                <div>
                  <label class="block text-xs font-semibold text-gray-700 mb-1">Clôture *</label>
                  <input
                    type="datetime-local"
                    name="endDateTime"
                    [(ngModel)]="endDateTimeInput"
                    (ngModelChange)="onDateInputsChange()"
                    required
                    class="w-full px-3.5 py-2.5 border rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#4285F4]/40 transition"
                    [class.border-red-400]="isDateRangeInvalid()"
                    [class.border-gray-300]="!isDateRangeInvalid()"
                  />
                </div>
              </div>

              @if (isDateRangeInvalid()) {
                <div class="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs flex items-center gap-2">
                  <svg class="w-4 h-4 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <span>La date de clôture doit être postérieure à l'ouverture.</span>
                </div>
              }

              @if (!isDateRangeInvalid() && datePreviewString()) {
                <div class="px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 flex items-center gap-2">
                  <span class="text-gray-400">📅</span>
                  <span class="font-semibold text-gray-800">{{ datePreviewString() }}</span>
                </div>
              }

              <!-- Journées du festival avec horaires par jour -->
              @if (!isDateRangeInvalid() && generatedFestivalDays().length > 0) {
                <div class="space-y-2">
                  <p class="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Horaires par journée</p>
                  <div class="space-y-2">
                    @for (d of generatedFestivalDays(); track d.id; let i = $index) {
                      <div class="p-3 bg-white border border-gray-200 rounded-xl">
                        <div class="flex items-center gap-2 mb-2.5">
                          <span class="w-2 h-2 rounded-full bg-[#4285F4] flex-shrink-0"></span>
                          <span class="text-xs font-bold text-gray-800">{{ d.name }}</span>
                          <span class="text-[11px] text-gray-400 ml-auto">{{ d.fullDate }}</span>
                        </div>
                        <div class="grid grid-cols-2 gap-2">
                          <div>
                            <label class="block text-[10px] font-semibold text-gray-500 mb-1">Début de journée</label>
                            <input
                              type="time"
                              [name]="'dayStart_' + d.id"
                              [(ngModel)]="dayHours[i].startsAt"
                              (ngModelChange)="onDayHoursChange()"
                              class="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#4285F4]/40"
                            />
                          </div>
                          <div>
                            <label class="block text-[10px] font-semibold text-gray-500 mb-1">Fin de journée</label>
                            <input
                              type="time"
                              [name]="'dayEnd_' + d.id"
                              [(ngModel)]="dayHours[i].endsAt"
                              (ngModelChange)="onDayHoursChange()"
                              class="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#4285F4]/40"
                            />
                          </div>
                        </div>
                      </div>
                    }
                  </div>
                </div>
              }
            </div>

            <!-- Contact & Settings -->
            <div class="space-y-4 pt-2 border-t border-gray-100">
              <h4 class="text-xs font-bold uppercase tracking-wider text-gray-400">Contact & Paramètres Live</h4>
              
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label class="block text-xs font-semibold text-gray-700 mb-1">Email de Contact</label>
                  <input
                    type="email"
                    name="contactEmail"
                    [(ngModel)]="formData.contact.email"
                    placeholder="gdgkivu@gmail.com"
                    class="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#4285F4]/40"
                  />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-700 mb-1">Téléphone</label>
                  <input
                    type="tel"
                    name="contactPhone"
                    [(ngModel)]="formData.contact.phone"
                    placeholder="+243..."
                    class="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#4285F4]/40"
                  />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-700 mb-1">Quota max questions/user</label>
                  <input
                    type="number"
                    name="maxQuestionsPerUser"
                    [(ngModel)]="formData.maxQuestionsPerUser"
                    min="1"
                    max="100"
                    class="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#4285F4]/40"
                  />
                </div>
              </div>

              <div class="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="isPublishedEvent"
                  name="isPublished"
                  [(ngModel)]="formData.isPublished"
                  class="w-4 h-4 text-[#4285F4] rounded border-gray-300 focus:ring-[#4285F4]"
                />
                <label for="isPublishedEvent" class="text-xs font-semibold text-gray-700 cursor-pointer">
                  Publier cette édition (visible publiquement)
                </label>
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
                [disabled]="isSaving() || isDateRangeInvalid()"
                class="flex items-center gap-2 px-5 py-2.5 bg-[#4285F4] hover:bg-[#3367D6] disabled:bg-gray-300 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition cursor-pointer"
              >
                @if (isSaving()) {
                  <svg class="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Enregistrement...</span>
                } @else {
                  <span>Enregistrer les modifications</span>
                }
              </button>
            </div>
          </form>
        }
      </div>
    </div>
  `,
})
export class EventConfigModalComponent implements OnInit {
  @Input({ required: true }) editionId!: string;
  @Output() close = new EventEmitter<void>();
  @Output() updated = new EventEmitter<void>();

  private fs = inject(FirestoreService);

  isLoading = signal(true);
  isSaving = signal(false);
  feedbackMessage = signal<string | null>(null);
  feedbackType = signal<'success' | 'error'>('success');

  startDateTimeInput = '';
  endDateTimeInput = '';
  isDateRangeInvalid = signal(false);
  datePreviewString = signal('');
  calculatedDaysCount = signal(1);
  generatedFestivalDays = signal<Array<{ id: string; name: string; date: string; fullDate: string }>>([]); 
  // Per-day hour overrides (parallel array to generatedFestivalDays)
  dayHours: Array<{ startsAt: string; endsAt: string }> = [];

  formData: EventDocument = {
    editionId: '',
    edition: 2025,
    year: 2025,
    name: '',
    fullName: '',
    theme: '',
    description: '',
    registrationUrl: '',
    venue: {
      city: 'Bukavu',
      country: 'RD Congo',
      fullLocation: 'Bukavu, RD Congo',
      conferenceCenter: 'Hotel Panorama Bukavu',
    },
    date: {
      start: new Date(),
      end: new Date(),
      display: {
        start: 29,
        end: 29,
        month: 'Novembre',
        year: 2025,
      },
    },
    contact: {
      email: 'gdgkivu@gmail.com',
      phone: '+243999537410',
    },
    impactStats: EVENT_CONFIG.impactStats,
    engagementYear: 5,
    maxQuestionsPerUser: 5,
    isPublished: true,
  };

  ngOnInit(): void {
    this.loadEventData();
  }

  private toDatetimeLocal(d: any): string {
    const date = d instanceof Date ? d : (d?.toDate ? d.toDate() : (d?.seconds ? new Date(d.seconds * 1000) : new Date(d)));
    if (!date || isNaN(date.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    const y = date.getFullYear();
    const m = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const h = pad(date.getHours());
    const min = pad(date.getMinutes());
    return `${y}-${m}-${day}T${h}:${min}`;
  }

  private loadEventData(): void {
    this.isLoading.set(true);
    this.fs.getEvent(this.editionId).subscribe({
      next: (event) => {
        if (event) {
          this.formData = {
            ...this.formData,
            ...event,
            venue: event.venue || this.formData.venue,
            date: {
              start: event.date?.start || this.formData.date.start,
              end: event.date?.end || this.formData.date.end,
              display: event.date?.display || this.formData.date.display,
            },
            contact: event.contact || this.formData.contact,
          };
        } else if (this.editionId === String(EVENT_CONFIG.edition)) {
          this.formData = {
            editionId: this.editionId,
            edition: EVENT_CONFIG.edition,
            year: EVENT_CONFIG.year,
            name: EVENT_CONFIG.name,
            fullName: EVENT_CONFIG.fullName,
            theme: EVENT_CONFIG.theme,
            description: EVENT_CONFIG.description,
            registrationUrl: EVENT_CONFIG.registrationUrl,
            venue: EVENT_CONFIG.venue,
            date: {
              start: EVENT_CONFIG.date.start,
              end: EVENT_CONFIG.date.end,
              display: EVENT_CONFIG.date.display,
            },
            contact: EVENT_CONFIG.contact,
            impactStats: EVENT_CONFIG.impactStats,
            engagementYear: EVENT_CONFIG.engagementYear,
            maxQuestionsPerUser: 5,
            isPublished: true,
          };
        }

        this.startDateTimeInput = this.toDatetimeLocal(this.formData.date.start);
        this.endDateTimeInput = this.toDatetimeLocal(this.formData.date.end);

        this.onDateInputsChange();
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  onDateInputsChange(): void {
    if (!this.startDateTimeInput || !this.endDateTimeInput) {
      this.isDateRangeInvalid.set(false);
      return;
    }

    const start = new Date(this.startDateTimeInput);
    const end = new Date(this.endDateTimeInput);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      this.isDateRangeInvalid.set(true);
      return;
    }

    if (end.getTime() < start.getTime()) {
      this.isDateRangeInvalid.set(true);
      this.datePreviewString.set('');
      return;
    }

    this.isDateRangeInvalid.set(false);

    // Update formData.date
    this.formData.date.start = start;
    this.formData.date.end = end;

    const sDay = start.getDate();
    const eDay = end.getDate();
    const sMonth = FRENCH_MONTHS[start.getMonth()];
    const eMonth = FRENCH_MONTHS[end.getMonth()];
    const sYear = start.getFullYear();
    const eYear = end.getFullYear();

    this.formData.date.display = {
      start: sDay,
      end: eDay,
      month: sMonth,
      year: sYear,
    };

    // Calculate calendar days
    const sCal = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const eCal = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    const daysCount = Math.max(1, Math.round((eCal.getTime() - sCal.getTime()) / (24 * 3600 * 1000)) + 1);
    this.calculatedDaysCount.set(daysCount);

    // Format display string
    let preview = '';
    if (sCal.getTime() === eCal.getTime()) {
      preview = `${sDay} ${sMonth} ${sYear}`;
    } else if (sMonth === eMonth && sYear === eYear) {
      preview = `Du ${sDay} au ${eDay} ${sMonth} ${sYear}`;
    } else if (sYear === eYear) {
      preview = `Du ${sDay} ${sMonth} au ${eDay} ${eMonth} ${sYear}`;
    } else {
      preview = `Du ${sDay} ${sMonth} ${sYear} au ${eDay} ${eMonth} ${eYear}`;
    }
    this.datePreviewString.set(preview);

    // Synchronize agenda days
    const days: Array<{ id: string; name: string; date: string; fullDate: string; location: string; isActive: boolean; startsAt?: string; endsAt?: string }> = [];
    for (let i = 0; i < daysCount; i++) {
      const cur = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      const dayNum = i + 1;
      const mName = FRENCH_MONTHS[cur.getMonth()];
      const wName = FRENCH_DAYS[cur.getDay()];

      // Default hours: Day 1 uses event start time, last day uses event end time, middle days 09:00-18:00
      const pad = (n: number) => String(n).padStart(2, '0');
      let defaultStart = '09:00';
      let defaultEnd = '18:00';
      if (i === 0) defaultStart = `${pad(start.getHours())}:${pad(start.getMinutes())}`;
      if (i === daysCount - 1) defaultEnd = `${pad(end.getHours())}:${pad(end.getMinutes())}`;

      days.push({
        id: `day${dayNum}`,
        name: daysCount > 1 ? `Jour ${dayNum}` : (this.formData.name || 'DevFest Kivu'),
        date: `${cur.getDate()} ${mName.slice(0, 3)}`,
        fullDate: `${wName} ${cur.getDate()} ${mName} ${cur.getFullYear()}`,
        location: this.formData.venue?.conferenceCenter || 'Bukavu, RD Congo',
        isActive: true,
        startsAt: this.dayHours[i]?.startsAt || defaultStart,
        endsAt: this.dayHours[i]?.endsAt || defaultEnd,
      });

      // Initialize dayHours if not already set
      if (!this.dayHours[i]) {
        this.dayHours[i] = {
          startsAt: defaultStart,
          endsAt: defaultEnd,
        };
      }
    }
    // Trim dayHours to match actual daysCount
    this.dayHours = this.dayHours.slice(0, daysCount);
    this.generatedFestivalDays.set(days);
    this.formData.agenda = { days };
  }

  onDayHoursChange(): void {
    const currentDays = this.generatedFestivalDays();
    const updated = currentDays.map((d, i) => ({
      ...d,
      startsAt: this.dayHours[i]?.startsAt || (d as any).startsAt,
      endsAt: this.dayHours[i]?.endsAt || (d as any).endsAt,
    }));
    this.formData.agenda = { days: updated as any };
  }

  async saveConfig(): Promise<void> {
    if (this.isSaving()) return;

    if (!this.formData.name?.trim()) {
      this.feedbackType.set('error');
      this.feedbackMessage.set('Veuillez renseigner le nom de l\'événement (ex: DevFest Kivu).');
      return;
    }

    if (this.isDateRangeInvalid()) {
      this.feedbackType.set('error');
      this.feedbackMessage.set('La date et heure de fin doit être postérieure ou égale à la date de début.');
      return;
    }

    this.isSaving.set(true);
    this.feedbackMessage.set(null);

    try {
      const year = parseInt(this.editionId, 10) || this.formData.date?.display?.year || 2025;
      await this.fs.saveEvent(this.editionId, {
        ...this.formData,
        editionId: this.editionId,
        edition: year,
        year,
      });

      this.feedbackType.set('success');
      this.feedbackMessage.set('Configuration de l\'événement enregistrée avec succès !');
      this.updated.emit();

      setTimeout(() => {
        this.close.emit();
      }, 1200);
    } catch (err: any) {
      this.feedbackType.set('error');
      this.feedbackMessage.set(err?.message || 'Erreur lors de l\'enregistrement.');
    } finally {
      this.isSaving.set(false);
    }
  }
}

