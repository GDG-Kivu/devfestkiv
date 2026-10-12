import { Component, computed, input, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DpTemplateConfig, EventConfig } from '../../../models/event.model';
import {
  DpTemplate,
  ParticipantRole,
  ROLE_META,
} from '../../../models/participant-role.model';

@Component({
  selector: 'app-generator',
  imports: [CommonModule],
  templateUrl: './generator.html',
})
export class Generator {
  @Input() fullName: string = '';
  @Input() previewImage: string | ArrayBuffer | null = null;
  @Input() quote: string = '';
  @Input() uiState: 'initial' | 'imageVisible' | 'templateVisible' = 'initial';
  @Input() generatorTheme: 'default' | 'white' = 'default';
  @Input() eventConfig!: EventConfig;

  role = input<ParticipantRole>('attendee');
  template = input<DpTemplate>('classic');
  dpConfig = input<DpTemplateConfig | null>(null);

  meta = computed(() => ROLE_META[this.role()]);

  // Valeurs Firestore (events/{editionId}.dpTemplate) avec fallback local
  get frameUrl(): string {
    return this.dpConfig()?.backgroundUrl || this.dpConfig()?.frameUrl || 'assets/dp-layout.png';
  }
  get logoUrl(): string {
    return this.dpConfig()?.logoUrl || 'assets/logo-1.png';
  }
  get circularLogoUrl(): string {
    return this.dpConfig()?.logoUrl || 'assets/logo.png';
  }
  get primaryColor(): string | null {
    return this.dpConfig()?.primaryColor || null;
  }
  get secondaryColor(): string | null {
    return this.dpConfig()?.secondaryColor || null;
  }
  get accentColor(): string | null {
    return this.dpConfig()?.accentColor || null;
  }
  get hashtag(): string {
    return this.dpConfig()?.hashtag || `#DevFestKivu${this.eventConfig.year}`;
  }
  get defaultQuote(): string {
    return this.dpConfig()?.defaultQuote || 'Le code est ma poésie.';
  }
  get dateText(): string {
    const dpDate = this.dpConfig()?.date;
    if (dpDate) return dpDate;

    const d = this.eventConfig.date.display;
    return `${d.start} ${d.month} ${this.dpConfig()?.year ?? d.year}`;
  }
  get locationText(): string {
    return this.dpConfig()?.location || this.eventConfig.venue.fullLocation || 'Bukavu, RD Congo';
  }
  get venueName(): string {
    return this.eventConfig.venue.conferenceCenter || 'DevFest Kivu';
  }
}