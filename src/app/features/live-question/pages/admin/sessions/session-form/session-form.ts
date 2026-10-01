import {
  Component,
  Input,
  Output,
  EventEmitter,
  inject,
  signal,
  computed,
  OnInit,
} from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { FirestoreService } from '../../../../../../core/firestore/firestore.service';
import { FieldValue, Timestamp } from '@angular/fire/firestore';
import { LiveSession } from '../../../../models/live-session.model';

@Component({
  selector: 'app-session-form',
  imports: [FormsModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div class="relative bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden my-auto animate-pop-in">
        
        <!-- Modal Header -->
        <div class="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0 bg-white">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-gray-100 text-gray-700 flex items-center justify-center flex-shrink-0">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 class="text-lg font-bold text-gray-900">
                {{ editingSession ? 'Modifier la session live' : 'Ajouter une session live' }}
              </h3>
              <p class="text-xs text-gray-500">
                {{ editingSession ? 'Mise à jour des informations et des horaires' : 'Planifiez une nouvelle session interactive en direct' }}
              </p>
            </div>
          </div>

          <button
            type="button"
            (click)="closeForm()"
            class="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 flex items-center justify-center transition cursor-pointer text-sm"
          >
            ✕
          </button>
        </div>

        <!-- Form Body -->
        <form
          #sessionForm="ngForm"
          (ngSubmit)="submitForm(sessionForm)"
          class="flex flex-col flex-1 overflow-hidden min-h-0"
        >
          <div class="p-6 sm:p-8 overflow-y-auto flex-1 space-y-5">
            <input type="hidden" [(ngModel)]="session.id" name="id" />

            <!-- Session Theme / Topic -->
            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1.5">
                Sujet / Thème de la session *
              </label>
              <input
                type="text"
                [(ngModel)]="session.theme"
                name="theme"
                required
                placeholder="Ex: Architecture Web Moderne & Angular v20"
                class="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#4285F4] focus:ring-2 focus:ring-[#4285F4]/20 transition"
              />
            </div>

            <!-- Speaker Info: Name & Role -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold text-gray-700 mb-1.5">
                  Nom du Speaker / Intervenant *
                </label>
                <input
                  type="text"
                  [(ngModel)]="session.speaker"
                  name="speaker"
                  required
                  placeholder="Ex: Daniella Ansima"
                  class="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#4285F4] focus:ring-2 focus:ring-[#4285F4]/20 transition"
                />
              </div>

              <div>
                <label class="block text-xs font-semibold text-gray-700 mb-1.5">
                  Titre / Rôle du Speaker *
                </label>
                <input
                  type="text"
                  [(ngModel)]="session.title"
                  name="title"
                  placeholder="Ex: Google Developer Expert (GDE)"
                  required
                  class="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#4285F4] focus:ring-2 focus:ring-[#4285F4]/20 transition"
                />
              </div>
            </div>

            <!-- Dynamic Time Selection Section (Clean Neutral Card) -->
            <div class="p-4 sm:p-5 rounded-2xl bg-gray-50/70 border border-gray-200/80 space-y-3.5">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                  <svg class="w-4 h-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  Horaires du créneau
                </span>

                @if (calculatedDurationText() && !isTimeRangeInvalid()) {
                  <span class="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gray-200/80 text-gray-800 border border-gray-300/60">
                    Durée : {{ calculatedDurationText() }}
                  </span>
                }
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label class="block text-xs font-medium text-gray-700 mb-1">Heure de début *</label>
                  <input
                    type="time"
                    name="startsAt"
                    [ngModel]="startsAt()"
                    (ngModelChange)="onStartTimeChange($event)"
                    required
                    class="w-full px-3.5 py-2 bg-white border rounded-xl text-xs sm:text-sm font-mono focus:outline-none focus:border-[#4285F4] focus:ring-2 focus:ring-[#4285F4]/20 transition"
                    [class.border-red-400]="isTimeRangeInvalid()"
                    [class.border-gray-200]="!isTimeRangeInvalid()"
                  />
                </div>

                <div>
                  <label class="block text-xs font-medium text-gray-700 mb-1">Heure de fin *</label>
                  <input
                    type="time"
                    name="endsAt"
                    [ngModel]="endsAt()"
                    (ngModelChange)="onEndTimeChange($event)"
                    required
                    class="w-full px-3.5 py-2 bg-white border rounded-xl text-xs sm:text-sm font-mono focus:outline-none focus:border-[#4285F4] focus:ring-2 focus:ring-[#4285F4]/20 transition"
                    [class.border-red-400]="isTimeRangeInvalid()"
                    [class.border-gray-200]="!isTimeRangeInvalid()"
                  />
                </div>
              </div>

              <!-- Quick Duration Preset Chips -->
              <div class="flex items-center gap-1.5 flex-wrap pt-1">
                <span class="text-[11px] text-gray-500 font-medium mr-1">Raccourcis durée :</span>
                <button
                  type="button"
                  (click)="setDuration(30)"
                  class="px-2.5 py-1 text-[11px] font-medium bg-white hover:bg-gray-100 text-gray-700 rounded-lg border border-gray-200 transition cursor-pointer"
                >
                  30 min
                </button>
                <button
                  type="button"
                  (click)="setDuration(45)"
                  class="px-2.5 py-1 text-[11px] font-medium bg-white hover:bg-gray-100 text-gray-700 rounded-lg border border-gray-200 transition cursor-pointer"
                >
                  45 min
                </button>
                <button
                  type="button"
                  (click)="setDuration(60)"
                  class="px-2.5 py-1 text-[11px] font-medium bg-white hover:bg-gray-100 text-gray-700 rounded-lg border border-gray-200 transition cursor-pointer"
                >
                  1 heure
                </button>
                <button
                  type="button"
                  (click)="setDuration(90)"
                  class="px-2.5 py-1 text-[11px] font-medium bg-white hover:bg-gray-100 text-gray-700 rounded-lg border border-gray-200 transition cursor-pointer"
                >
                  1h 30
                </button>
              </div>

              <!-- Time Validation Error Alert -->
              @if (isTimeRangeInvalid()) {
                <div class="p-2.5 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs flex items-center gap-2">
                  <svg class="w-4 h-4 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <span>L'heure de fin doit être postérieure à l'heure de début.</span>
                </div>
              }
            </div>

            <!-- Track / Category & Slides Link -->
            <div class="space-y-3">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-semibold text-gray-700 mb-1.5">Track / Thématique *</label>
                  <input
                    type="text"
                    list="tracksList"
                    [(ngModel)]="session.track"
                    name="track"
                    placeholder="Ex: Dev Track, AI Track..."
                    class="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#4285F4] focus:ring-2 focus:ring-[#4285F4]/20 transition"
                  />
                  <datalist id="tracksList">
                    <option value="Dev Track"></option>
                    <option value="Tech Track"></option>
                    <option value="Cloud Track"></option>
                    <option value="Security Track"></option>
                    <option value="Fintech Track"></option>
                    <option value="Design Track"></option>
                    <option value="AI & Data Track"></option>
                  </datalist>
                </div>

                <div>
                  <label class="block text-xs font-semibold text-gray-700 mb-1.5">Lien Slides (URL de présentation)</label>
                  <input
                    type="text"
                    [(ngModel)]="session.slides"
                    name="slides"
                    placeholder="https://docs.google.com/presentation/d/..."
                    class="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#4285F4] focus:ring-2 focus:ring-[#4285F4]/20 transition"
                  />
                </div>
              </div>

              <!-- Quick Track Chips Spanning Horizontally -->
              <div class="pt-0.5">
                <span class="block text-[11px] font-medium text-gray-500 mb-1.5">Sélection rapide du Track :</span>
                <div class="flex items-center gap-1.5 flex-wrap">
                  @for (t of commonTracks; track t) {
                    <button
                      type="button"
                      (click)="session.track = t"
                      class="text-xs px-2.5 py-1 rounded-lg font-medium border transition cursor-pointer"
                      [class.bg-gray-900]="session.track === t"
                      [class.text-white]="session.track === t"
                      [class.border-gray-900]="session.track === t"
                      [class.bg-white]="session.track !== t"
                      [class.border-gray-200]="session.track !== t"
                      [class.text-gray-700]="session.track !== t"
                      [class.hover:bg-gray-50]="session.track !== t"
                    >
                      {{ t }}
                    </button>
                  }
                </div>
              </div>
            </div>

            <!-- Description -->
            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1.5">Description de la présentation</label>
              <textarea
                [(ngModel)]="session.description"
                name="description"
                rows="3"
                placeholder="Décrivez les objectifs et les thèmes abordés lors de cette session..."
                class="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#4285F4] focus:ring-2 focus:ring-[#4285F4]/20 transition"
              ></textarea>
            </div>

            <!-- Session Active Toggle (Clean Neutral Box) -->
            <div class="flex items-center justify-between p-4 bg-gray-50/70 rounded-2xl border border-gray-200/80">
              <div>
                <span class="block text-xs font-bold text-gray-900">Activer la session immédiatement</span>
                <span class="block text-[11px] text-gray-500 mt-0.5">Permet au public d'envoyer des questions en direct</span>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" [(ngModel)]="session.isActive" name="isActive" class="sr-only peer" />
                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#34A853]"></div>
              </label>
            </div>

            <!-- Error Message -->
            @if (errorMessage()) {
              <div class="text-xs p-3.5 rounded-xl bg-red-50 text-red-700 border border-red-200 flex items-center gap-2">
                <svg class="w-4 h-4 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span>{{ errorMessage() }}</span>
              </div>
            }
          </div>

          <!-- Fixed Footer -->
          <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0 bg-white">
            <button
              type="button"
              (click)="closeForm()"
              class="px-4 py-2 text-xs sm:text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              [disabled]="isTimeRangeInvalid()"
              class="px-5 py-2.5 bg-[#4285F4] hover:bg-[#3367D6] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-xs sm:text-sm rounded-xl transition cursor-pointer shadow-xs"
            >
              {{ editingSession ? 'Mettre à jour' : 'Enregistrer la session' }}
            </button>
          </div>
        </form>
      </div>
    </div>
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
export class SessionForm<T> implements OnInit {
  @Input() sessionToEdit?: LiveSession<T>;
  @Output() closed = new EventEmitter<boolean>();

  private fs = inject(FirestoreService);

  session: LiveSession<T> = this.getEmptySession();
  editingSession: boolean = false;
  errorMessage = signal<string | null>(null);

  // Dynamic time states
  startsAt = signal<string>('09:00');
  endsAt = signal<string>('09:45');

  readonly commonTracks = [
    'Dev Track',
    'Tech Track',
    'Cloud Track',
    'Security Track',
    'Fintech Track',
    'Design Track',
  ];

  isTimeRangeInvalid = computed(() => {
    const s = this.startsAt();
    const e = this.endsAt();
    if (!s || !e) return false;
    return this.timeToMinutes(e) <= this.timeToMinutes(s);
  });

  calculatedDurationText = computed(() => {
    const s = this.startsAt();
    const e = this.endsAt();
    if (!s || !e) return '';
    const diff = this.timeToMinutes(e) - this.timeToMinutes(s);
    if (diff <= 0) return '';
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    if (h === 0) return `${m} min`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}min`;
  });

  ngOnInit(): void {
    if (this.sessionToEdit) {
      this.editingSession = true;
      this.session = { ...this.sessionToEdit };
      this.parseInitialTime(this.session.time);
    } else {
      this.editingSession = false;
      this.session = this.getEmptySession();
      this.autoSuggestNextSlot();
    }
  }

  private timeToMinutes(t: string): number {
    if (!t || !t.includes(':')) return 0;
    const [h, m] = t.split(':').map(Number);
    return (isNaN(h) ? 0 : h) * 60 + (isNaN(m) ? 0 : m);
  }

  private minutesToTime(totalMins: number): string {
    const wrapped = ((totalMins % 1440) + 1440) % 1440;
    const h = Math.floor(wrapped / 60);
    const m = wrapped % 60;
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(h)}:${pad(m)}`;
  }

  private parseInitialTime(timeStr?: string): void {
    if (!timeStr) {
      this.startsAt.set('09:00');
      this.endsAt.set('09:45');
      this.syncSessionTime();
      return;
    }

    const match = timeStr.match(/(\d{1,2}:\d{2})\s*[-–—]\s*(\d{1,2}:\d{2})/);
    if (match) {
      this.startsAt.set(match[1]);
      this.endsAt.set(match[2]);
    } else {
      this.startsAt.set('09:00');
      this.endsAt.set('09:45');
    }
    this.syncSessionTime();
  }

  private autoSuggestNextSlot(): void {
    this.fs.getSessions().subscribe({
      next: (sessions: LiveSession<Timestamp>[]) => {
        if (!this.editingSession && sessions && sessions.length > 0) {
          // Find the latest endsAt among existing sessions
          let latestEndMinutes = 0;
          for (const s of sessions) {
            if (s.time) {
              const match = s.time.match(/(\d{1,2}:\d{2})\s*[-–—]\s*(\d{1,2}:\d{2})/);
              if (match) {
                const endMins = this.timeToMinutes(match[2]);
                if (endMins > latestEndMinutes) {
                  latestEndMinutes = endMins;
                }
              }
            }
          }

          if (latestEndMinutes > 0 && latestEndMinutes < 1440 - 15) {
            const newStart = this.minutesToTime(latestEndMinutes);
            const newEnd = this.minutesToTime(latestEndMinutes + 45);
            this.startsAt.set(newStart);
            this.endsAt.set(newEnd);
            this.syncSessionTime();
            return;
          }
        }

        this.startsAt.set('09:00');
        this.endsAt.set('09:45');
        this.syncSessionTime();
      },
      error: () => {
        this.startsAt.set('09:00');
        this.endsAt.set('09:45');
        this.syncSessionTime();
      },
    });
  }

  onStartTimeChange(newStart: string): void {
    const prevStartMins = this.timeToMinutes(this.startsAt());
    const prevEndMins = this.timeToMinutes(this.endsAt());
    const duration = prevEndMins > prevStartMins ? prevEndMins - prevStartMins : 45;

    this.startsAt.set(newStart);
    const newStartMins = this.timeToMinutes(newStart);
    this.endsAt.set(this.minutesToTime(newStartMins + duration));
    this.syncSessionTime();
  }

  onEndTimeChange(newEnd: string): void {
    this.endsAt.set(newEnd);
    this.syncSessionTime();
  }

  setDuration(minutes: number): void {
    const startMins = this.timeToMinutes(this.startsAt());
    this.endsAt.set(this.minutesToTime(startMins + minutes));
    this.syncSessionTime();
  }

  private syncSessionTime(): void {
    if (this.startsAt() && this.endsAt()) {
      this.session.time = `${this.startsAt()} - ${this.endsAt()}`;
    }
  }

  private getEmptySession(): LiveSession<T> {
    const now = new Date() as any;
    return {
      id: '',
      title: '',
      speaker: '',
      theme: '',
      time: '09:00 - 09:45',
      track: 'Dev Track',
      slides: '',
      questions: [],
      description: '',
      isActive: true,
      createAt: now,
      updateAt: now,
    };
  }

  submitForm(form: NgForm): void {
    if (!this.session.theme?.trim()) {
      this.errorMessage.set('Veuillez renseigner le thème / sujet de la session.');
      return;
    }
    if (!this.session.speaker?.trim()) {
      this.errorMessage.set('Veuillez renseigner le nom de l\'intervenant / speaker.');
      return;
    }
    if (!this.session.title?.trim()) {
      this.errorMessage.set('Veuillez renseigner le titre ou rôle du speaker.');
      return;
    }
    if (this.isTimeRangeInvalid()) {
      this.errorMessage.set('L\'heure de fin doit être postérieure à l\'heure de début.');
      return;
    }

    this.syncSessionTime();
    this.errorMessage.set(null);

    this.session.id = this.session.id ? this.session.id : this.fs.createDocId(`sessions`);
    this.session.createAt = this.session.createAt ? this.session.createAt : (new Date() as any);
    this.session.updateAt = new Date() as any;

    this.fs.setSession(this.session as LiveSession<FieldValue>);
    this.closeForm();
  }

  closeForm(): void {
    this.closed.emit(true);
  }
}
