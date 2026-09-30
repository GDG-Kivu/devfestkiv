import { Component, OnDestroy, OnInit, signal, inject, PLATFORM_ID, effect } from '@angular/core';
import PastEventsGallery from '../../components/past-events-gallery/past-events-gallery';
import { RouterLink } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';
import { EventConfigService } from '../../services/event-config.service';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-home',
  imports: [PastEventsGallery, RouterLink, NgOptimizedImage],
  templateUrl: 'home.html',
  styles: `
    .video-wrapper {
      aspect-ratio: 16 / 9;
    }

    /* Hero Section Animations */
    .animate-fade-in {
      animation: fadeIn 1s ease-out forwards;
      opacity: 0;
    }

    .animate-slide-down {
      animation: slideDown 0.8s ease-out forwards;
      opacity: 0;
    }

    .animate-slide-up {
      animation: slideUp 0.8s ease-out forwards;
      opacity: 0;
    }

    .animate-slide-right {
      animation: slideRight 1s ease-out forwards;
      opacity: 0;
    }

    .animate-pulse-slow {
      animation: pulseSlow 4s ease-in-out infinite;
    }

    .animate-fade-in-up {
      animation: fadeInUp 0.8s ease-out;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 0.4;
      }
    }

    @keyframes slideDown {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    @keyframes slideUp {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    @keyframes slideRight {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    @keyframes pulseSlow {
      0%,
      100% {
        opacity: 0.5;
        transform: scale(1);
      }
      50% {
        opacity: 0.8;
        transform: scale(1.05);
      }
    }

    @keyframes fadeInUp {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }
  `,
})
export default class HomeComponent implements OnInit, OnDestroy {
  public eventConfig = inject(EventConfigService);
  private platformId = inject(PLATFORM_ID);

  seconde = signal(0);
  minutes = signal(0);
  hours = signal(0);
  daysLeft = signal(0);

  targetDateTimeString = signal(this.eventConfig.getTargetDateTimeString());
  countdownRunning = signal(false);
  isEventPast = signal(false);
  isEventOngoing = signal(false);

  private countdownInterval: any;
  private endTime = 0;
  private readonly STORAGE_KEY = 'countdown_end_time';

  constructor() {
    effect(() => {
      // Re-evaluate whenever the event document changes
      this.eventConfig.eventDocument();
      if (isPlatformBrowser(this.platformId)) {
        this.evaluateEventStatus();
      }
    });
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.evaluateEventStatus();
    }
  }

  evaluateEventStatus(): void {
    const config = this.eventConfig.getConfig();
    const startDate = config.date?.start ? new Date(config.date.start) : null;
    const endDate = config.date?.end ? new Date(config.date.end) : null;
    const now = Date.now();

    if (!startDate || isNaN(startDate.getTime())) {
      this.isEventPast.set(true);
      this.isEventOngoing.set(false);
      this.countdownRunning.set(false);
      this.resetTimeSignals();
      return;
    }

    const startMs = startDate.getTime();
    let endMs = endDate && !isNaN(endDate.getTime()) ? endDate.getTime() : startMs + 24 * 3600 * 1000;
    if (endMs <= startMs) {
      endMs = startMs + 24 * 3600 * 1000;
    }

    this.targetDateTimeString.set(startDate.toISOString().slice(0, 19));
    this.updateEventDayFromTarget();

    if (now < startMs) {
      // Événement futur : compte à rebours actif
      this.isEventPast.set(false);
      this.isEventOngoing.set(false);
      this.countdownRunning.set(true);
      this.endTime = startMs;
      this.updateTimeDisplay();
      this.startInterval();
    } else if (now >= startMs && now <= endMs) {
      // Événement en cours : a démarré mais date de fin pas encore atteinte
      this.stopInterval();
      this.isEventPast.set(false);
      this.isEventOngoing.set(true);
      this.countdownRunning.set(false);
      this.resetTimeSignals();
    } else {
      // Événement clôturé : date de fin dépassée
      this.stopInterval();
      this.isEventPast.set(true);
      this.isEventOngoing.set(false);
      this.countdownRunning.set(false);
      this.resetTimeSignals();
    }
  }

  private startInterval(): void {
    this.stopInterval();
    this.countdownInterval = setInterval(() => this.updateTimeDisplay(), 1000);
  }

  private stopInterval(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }

  private updateTimeDisplay(): void {
    const now = Date.now();
    const remainingMs = this.endTime - now;

    if (remainingMs <= 0) {
      this.evaluateEventStatus();
      return;
    }

    const totalSeconds = Math.floor(remainingMs / 1000);
    const days = Math.floor(totalSeconds / (3600 * 24));
    const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    this.daysLeft.set(days);
    this.hours.set(hours);
    this.minutes.set(minutes);
    this.seconde.set(seconds);
  }

  private resetTimeSignals(): void {
    this.daysLeft.set(0);
    this.hours.set(0);
    this.minutes.set(0);
    this.seconde.set(0);
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch {}
  }

  formatTime(value: number): string {
    return String(value).padStart(2, '0');
  }

  ngOnDestroy(): void {
    this.stopInterval();
  }

  NowDate = new Date();
  eventDay = this.eventConfig.getEventDay();

  updateEventDayFromTarget(): void {
    const dateValue = this.targetDateTimeString();
    if (!dateValue) return;

    const date = new Date(dateValue);

    const months = [
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

    this.eventDay.start.set(date.getDate());
    this.eventDay.end.set(date.getDate() + 1);
    this.eventDay.month.set(months[date.getMonth()]);
    this.eventDay.year.set(date.getFullYear());
  }

  engagementYear = this.eventConfig.engagementYear;

  impactStats = this.eventConfig.impactStats;

  supports = this.eventConfig.supports;

  registrationUrl = this.eventConfig.registrationUrl;
}
