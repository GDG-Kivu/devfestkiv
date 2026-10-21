import { Component, computed, input, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DpTemplateConfig, EventConfig } from '../../../models/event.model';

import {
  DpTemplate,
  ParticipantRole,
  ROLE_META,
  ROLE_THEME,
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
  @Input()uiState: 'initial' | 'imageVisible' | 'templateVisible' = 'initial';
  @Input()generatorTheme: 'default' | 'white' = 'default';
  @Input()eventConfig!: EventConfig;

  role = input<ParticipantRole>('attendee');
  template = input<DpTemplate>('classic');
  dpConfig = input<DpTemplateConfig | null>(null);

  meta = computed(() => ROLE_META[this.role()]);
  theme = computed(() => ROLE_THEME[this.role()]);

  /**
   * Illustration du nouveau design selon le rôle.
   */
  roleIllustration = computed<string | null>(() => {
    const illustrations: Partial<Record<ParticipantRole, string>> = {
      speaker: 'assets/micro.png',
      organizer: 'assets/equipe.png',
      volunteer: 'assets/mains.png',
    };

    return illustrations[this.role()] ?? null;
  });

  /**
   * Taille dynamique du nom dans le nouveau design.
   */
  get nameFontSize(): number {
    const length = this.fullName.trim().length;

    if (length <= 16) return 34;
    if (length <= 22) return 27;
    if (length <= 30) return 22;
    if (length <= 40) return 18;

    return 15;
  }

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
    const configuredDate = this.dpConfig()?.date;

    if (configuredDate) {
      return configuredDate;
    }

    const date = this.eventConfig.date.display;

    return `${date.start} ${date.month} ${this.dpConfig()?.year ?? date.year}`;
  }

  get locationText(): string {
    return this.dpConfig()?.location || this.eventConfig.venue.fullLocation || 'Bukavu, RD Congo';
  }

  get venueName(): string {
    return this.eventConfig.venue.conferenceCenter || 'DevFest Kivu';
  }
}
