import { Component, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirestoreService } from '../../../../../../../core/firestore/firestore.service';
import { EventDocument } from '../../../../../../event/models/event.model';
import { EVENT_CONFIG } from '../../../../../../../config/event.config';

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
  templateUrl: "event-config-modal.component.html"
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

