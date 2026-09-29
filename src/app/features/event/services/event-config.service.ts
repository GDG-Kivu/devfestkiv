import { Injectable, signal } from '@angular/core';
import { EVENT_CONFIG } from '../../../config/event.config';
import { EventConfig } from '../models/event.model';

@Injectable({
  providedIn: 'root',
})
export class EventConfigService {
  private config = signal<EventConfig>(EVENT_CONFIG);

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
