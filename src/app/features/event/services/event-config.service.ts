import { Injectable, inject, signal, computed } from '@angular/core';
import { EVENT_CONFIG } from '../../../config/event.config';
import { EventConfig, EventDocument } from '../models/event.model';
import { FirestoreService } from '../../../core/firestore/firestore.service';

export interface FestivalDaySchedule {
  id: string;
  dayNumber: number;
  name: string;
  date: string;
  fullDate: string;
  location: string;
  isActive: boolean;
  startTime: Date;
  endTime: Date;
  startMs: number;
  endMs: number;
  startsAt: string;
  endsAt: string;
}

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

@Injectable({
  providedIn: 'root',
})
export class EventConfigService {
  private config = signal<EventConfig>(EVENT_CONFIG);
  readonly eventDocument = signal<EventDocument | null>(null);

  constructor() {
    const fs = inject(FirestoreService, { optional: true });
    if (fs) {
      fs.getCurrentEventWithFallback().subscribe((eventDoc) => {
        if (eventDoc) {
          this.eventDocument.set(eventDoc);
          this.syncFromDocument(eventDoc);
        }
      });
    }
  }

  private syncFromDocument(doc: EventDocument): void {
    const normalizeDate = (d: any, fallback: Date): Date => {
      if (d instanceof Date) return d;
      if (d && typeof d.toDate === 'function') return d.toDate();
      if (d && typeof d.seconds === 'number') return new Date(d.seconds * 1000);
      if (typeof d === 'string') return new Date(d);
      return fallback;
    };

    const startDate = normalizeDate(doc.date?.start, EVENT_CONFIG.date.start);
    const endDate = normalizeDate(doc.date?.end, EVENT_CONFIG.date.end);

    const updated: EventConfig = {
      ...EVENT_CONFIG,
      edition: doc.edition || EVENT_CONFIG.edition,
      year: doc.year || EVENT_CONFIG.year,
      name: doc.name || EVENT_CONFIG.name,
      fullName: doc.fullName || EVENT_CONFIG.fullName,
      theme: doc.theme || EVENT_CONFIG.theme,
      description: doc.description || EVENT_CONFIG.description,
      registrationUrl: doc.registrationUrl ?? EVENT_CONFIG.registrationUrl,
      venue: doc.venue || EVENT_CONFIG.venue,
      contact: doc.contact || EVENT_CONFIG.contact,
      impactStats: doc.impactStats || EVENT_CONFIG.impactStats,
      engagementYear: doc.engagementYear || EVENT_CONFIG.engagementYear,
      supports: doc.supports || EVENT_CONFIG.supports,
      pastEvents: doc.pastEvents || EVENT_CONFIG.pastEvents,
      agenda: doc.agenda || EVENT_CONFIG.agenda,
      date: {
        start: startDate,
        end: endDate,
        display: doc.date?.display || EVENT_CONFIG.date.display,
      },
    };
    this.config.set(updated);
  }

  getConfig(): EventConfig {
    return this.config();
  }

  // Computed properties for easy access
  get edition(): number {
    return this.config().edition;
  }

  get year(): number {
    return this.config().year;
  }

  get name(): string {
    return this.config().name;
  }

  get fullName(): string {
    return this.config().fullName;
  }

  get date() {
    return this.config().date;
  }

  get venue() {
    return this.config().venue;
  }

  get theme(): string {
    return this.config().theme;
  }

  get description(): string {
    return this.config().description;
  }

  get registrationUrl(): string {
    return this.config().registrationUrl;
  }

  get contact() {
    return this.config().contact;
  }

  get impactStats() {
    return this.config().impactStats;
  }

  get engagementYear(): number {
    return this.config().engagementYear;
  }

  get supports() {
    return this.config().supports;
  }

  get pastEvents() {
    return this.config().pastEvents;
  }

  get agenda() {
    return this.config().agenda;
  }

  get firebase() {
    return this.config().firebase;
  }

  // Helper methods
  getTargetDateTimeString(): string {
    return this.date.start.toISOString().slice(0, 19);
  }

  getEventDay() {
    return {
      start: signal(this.date.display.start),
      end: signal(this.date.display.end),
      month: signal(this.date.display.month),
      year: signal(this.date.display.year),
    };
  }

  /**
   * Returns whether this event spans more than 1 day
   */
  isMultiDayEvent(): boolean {
    const s = new Date(this.date.start);
    const e = new Date(this.date.end);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return false;
    return (
      s.getFullYear() !== e.getFullYear() ||
      s.getMonth() !== e.getMonth() ||
      s.getDate() !== e.getDate() ||
      (this.agenda?.days && this.agenda.days.length > 1)
    );
  }

  /**
   * Formatted date range string for display in UI (e.g. "28 - 29 Novembre 2025" or "29 Novembre 2025")
   */
  getFormattedDateRange(): string {
    const s = new Date(this.date.start);
    const e = new Date(this.date.end);

    if (isNaN(s.getTime())) {
      const disp = this.date.display;
      if (disp.start !== disp.end) {
        return `${disp.start} - ${disp.end} ${disp.month} ${disp.year}`;
      }
      return `${disp.start} ${disp.month} ${disp.year}`;
    }

    const sDay = s.getDate();
    const sMonth = FRENCH_MONTHS[s.getMonth()];
    const sYear = s.getFullYear();

    if (isNaN(e.getTime()) || (s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth() && sDay === e.getDate())) {
      return `${sDay} ${sMonth} ${sYear}`;
    }

    const eDay = e.getDate();
    const eMonth = FRENCH_MONTHS[e.getMonth()];
    const eYear = e.getFullYear();

    if (sYear === eYear && sMonth === eMonth) {
      return `${sDay} - ${eDay} ${sMonth} ${sYear}`;
    } else if (sYear === eYear) {
      return `${sDay} ${sMonth.slice(0, 4)} - ${eDay} ${eMonth} ${sYear}`;
    } else {
      return `${sDay} ${sMonth.slice(0, 4)} ${sYear} - ${eDay} ${eMonth.slice(0, 4)} ${eYear}`;
    }
  }

  /**
   * Formatted badge string including location (e.g. "28 - 29 Novembre 2025 • Bukavu, RD Congo")
   */
  getFormattedDateBadge(): string {
    const range = this.getFormattedDateRange();
    const loc = this.venue.fullLocation || 'Bukavu, RD Congo';
    return `${range} • ${loc}`;
  }

  /**
   * Formatted short month and year (e.g. "Novembre 2025")
   */
  getFormattedDateShort(): string {
    const s = new Date(this.date.start);
    if (!isNaN(s.getTime())) {
      return `${FRENCH_MONTHS[s.getMonth()]} ${s.getFullYear()}`;
    }
    return `${this.date.display.month} ${this.date.display.year}`;
  }

  /**
   * Computes a structured list of all festival days with exact timestamps
   * for handling countdowns, agenda tabs, and multi-day status tracking.
   */
  getFestivalDays(overrideConfig?: EventConfig): FestivalDaySchedule[] {
    const config = overrideConfig || this.config();
    const startDate = config.date?.start ? new Date(config.date.start) : new Date();
    const endDate = config.date?.end ? new Date(config.date.end) : new Date(startDate.getTime() + 9 * 3600 * 1000);

    const pad = (n: number) => String(n).padStart(2, '0');
    const defaultStartHours = !isNaN(startDate.getHours()) ? startDate.getHours() : 9;
    const defaultStartMinutes = !isNaN(startDate.getMinutes()) ? startDate.getMinutes() : 0;
    const defaultEndHours = !isNaN(endDate.getHours()) ? endDate.getHours() : 18;
    const defaultEndMinutes = !isNaN(endDate.getMinutes()) ? endDate.getMinutes() : 0;

    const daysConfig = config.agenda?.days || [];

    // Calculate number of days between start and end date
    const sCal = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const eCal = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    const dayCount = Math.max(1, Math.round((eCal.getTime() - sCal.getTime()) / (24 * 3600 * 1000)) + 1);

    const totalDays = Math.max(dayCount, daysConfig.length || 1);
    const schedules: FestivalDaySchedule[] = [];

    for (let i = 0; i < totalDays; i++) {
      const dayDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + i);
      const dayConfig = daysConfig[i];

      const dayNumber = i + 1;
      const dayId = dayConfig?.id || `day${dayNumber}`;
      const dayName = dayConfig?.name || (totalDays > 1 ? `Jour ${dayNumber}` : config.name || 'DevFest Kivu');
      
      let startH = defaultStartHours;
      let startM = defaultStartMinutes;
      let endH = defaultEndHours;
      let endM = defaultEndMinutes;

      if (dayConfig?.startsAt && typeof dayConfig.startsAt === 'string' && dayConfig.startsAt.includes(':')) {
        const [sh, sm] = dayConfig.startsAt.split(':').map(Number);
        if (!isNaN(sh) && !isNaN(sm)) {
          startH = sh;
          startM = sm;
        }
      }

      if (dayConfig?.endsAt && typeof dayConfig.endsAt === 'string' && dayConfig.endsAt.includes(':')) {
        const [eh, em] = dayConfig.endsAt.split(':').map(Number);
        if (!isNaN(eh) && !isNaN(em)) {
          endH = eh;
          endM = em;
        }
      }

      const dayStart = new Date(dayDate);
      dayStart.setHours(startH, startM, 0, 0);

      const dayEnd = new Date(dayDate);
      dayEnd.setHours(endH, endM, 0, 0);

      const dayMonth = FRENCH_MONTHS[dayDate.getMonth()];
      const dayWeek = FRENCH_DAYS[dayDate.getDay()];
      const dateShort = `${dayDate.getDate()} ${dayMonth.slice(0, 3)}`;
      const fullDate = `${dayWeek} ${dayDate.getDate()} ${dayMonth} ${dayDate.getFullYear()}`;
      const location = dayConfig?.location || config.venue?.conferenceCenter || config.venue?.fullLocation || 'Bukavu, RD Congo';

      schedules.push({
        id: dayId,
        dayNumber,
        name: dayName,
        date: dayConfig?.date || dateShort,
        fullDate: dayConfig?.fullDate || fullDate,
        location,
        isActive: dayConfig?.isActive ?? true,
        startTime: dayStart,
        endTime: dayEnd,
        startMs: dayStart.getTime(),
        endMs: dayEnd.getTime(),
        startsAt: `${pad(startH)}:${pad(startM)}`,
        endsAt: `${pad(endH)}:${pad(endM)}`,
      });
    }

    return schedules;
  }

  // Method to update config for future editions
  updateConfig(newConfig: Partial<EventConfig>): void {
    this.config.set({ ...this.config(), ...newConfig });
  }
}

