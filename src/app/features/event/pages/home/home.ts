import { Component, OnDestroy, OnInit, signal, inject, PLATFORM_ID, effect } from '@angular/core';
import PastEventsGallery from '../../components/past-events-gallery/past-events-gallery';
import { RouterLink } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';
import { EventConfigService, FestivalDaySchedule } from '../../services/event-config.service';
import { FirestoreService } from '../../../../core/firestore/firestore.service';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-home',
  imports: [PastEventsGallery, RouterLink, NgOptimizedImage],
  templateUrl: 'home.html',
  styles: `
    .video-wrapper {
      aspect-ratio: 16 / 9;
    }

    /* Hero Section Animations - smooth entrance without initial hiding flash */
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
  private fs = inject(FirestoreService, { optional: true });
  private platformId = inject(PLATFORM_ID);

  seconde = signal(0);
  minutes = signal(0);
  hours = signal(0);
  daysLeft = signal(0);

  targetDateTimeString = signal(this.eventConfig.getTargetDateTimeString());
  countdownRunning = signal(false);
  isEventPast = signal(false);
  isEventOngoing = signal(false);

  // Successive & Multi-day Context Signals
  targetTitle = signal("L'événement commence dans");
  targetSubTitle = signal('');
  targetBadge = signal<string | null>(null);
  activeDayBadge = signal('En direct');
  activeDayLocation = signal('');

  private countdownInterval: any;
  private endTime = 0;
  private readonly STORAGE_KEY = 'countdown_end_time';

  constructor() {
    this.evaluateEventStatus();

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
    const festivalDays: FestivalDaySchedule[] = this.eventConfig.getFestivalDays(config);
    const now = Date.now();

    if (!festivalDays || festivalDays.length === 0) {
      this.isEventPast.set(true);
      this.isEventOngoing.set(false);
      this.countdownRunning.set(false);
      this.resetTimeSignals();
      return;
    }

    // 1. Check if ANY day of the current edition is currently active (ongoing)
    const activeDay = festivalDays.find((d) => now >= d.startMs && now <= d.endMs);
    if (activeDay) {
      this.stopInterval();
      this.isEventPast.set(false);
      this.isEventOngoing.set(true);
      this.countdownRunning.set(false);
      this.activeDayBadge.set(festivalDays.length > 1 ? `${activeDay.name} en direct` : 'Événement en direct');
      this.activeDayLocation.set(activeDay.location);
      this.resetTimeSignals();
      return;
    }

    // 2. Check if there is an upcoming day in the CURRENT event edition
    const nextUpcomingDay = festivalDays.find((d) => d.startMs > now);
    if (nextUpcomingDay) {
      this.isEventPast.set(false);
      this.isEventOngoing.set(false);
      this.countdownRunning.set(true);
      this.endTime = nextUpcomingDay.startMs;

      if (nextUpcomingDay.dayNumber === 1) {
        this.targetTitle.set(
          festivalDays.length > 1 ? 'Le Jour 1 commence dans' : "L'événement commence dans",
        );
        this.targetSubTitle.set(
          festivalDays.length > 1 ? `Jour 1 sur ${festivalDays.length}` : 'Rendez-vous pour une expérience technologique unique.',
        );
        this.targetBadge.set(
          festivalDays.length > 1 ? `Jour 1 / ${festivalDays.length}` : 'Bientôt disponible',
        );
      } else {
        // Successive Day in Multi-day Festival (e.g. Day 1 has ended, Day 2 is next!)
        this.targetTitle.set(`Le ${nextUpcomingDay.name} commence dans`);
        this.targetSubTitle.set(
          `Suite du festival • ${nextUpcomingDay.name}`,
        );
        this.targetBadge.set(`Jour ${nextUpcomingDay.dayNumber} / ${festivalDays.length}`);
      }

      this.targetDateTimeString.set(nextUpcomingDay.startTime.toISOString().slice(0, 19));
      this.updateTimeDisplay();
      this.startInterval();
      return;
    }

    // 3. All days of current edition have finished -> Event is past / completed for this edition
    this.stopInterval();
    this.isEventPast.set(true);
    this.isEventOngoing.set(false);
    this.countdownRunning.set(false);
    this.resetTimeSignals();
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

  engagementYear = this.eventConfig.engagementYear;
  impactStats = this.eventConfig.impactStats;
  supports = this.eventConfig.supports;
  registrationUrl = this.eventConfig.registrationUrl;
}

