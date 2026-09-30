import { Injectable, inject, signal } from '@angular/core';
import { EVENT_CONFIG } from '../../../config/event.config';
import { EventConfig, EventDocument } from '../models/event.model';
import { FirestoreService } from '../../../core/firestore/firestore.service';

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

  // Method to update config for future editions
  updateConfig(newConfig: Partial<EventConfig>): void {
    this.config.set({ ...this.config(), ...newConfig });
  }
}
