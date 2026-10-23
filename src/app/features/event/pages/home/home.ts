import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  signal,
  inject,
  PLATFORM_ID,
  effect,
  NgZone,
} from '@angular/core';
import PastEventsGallery from '../../components/past-events-gallery/past-events-gallery';
import { RouterLink } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';
import { EventConfigService, FestivalDaySchedule } from '../../services/event-config.service';
import { FirestoreService } from '../../../../core/firestore/firestore.service';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
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
        transform: translateY(-30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes slideRight {
      from {
        opacity: 0;
        transform: translateX(-50px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
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
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `,
})
export default class HomeComponent implements OnInit, OnDestroy {
  public eventConfig = inject(EventConfigService);
  private fs = inject(FirestoreService, { optional: true });
  private platformId = inject(PLATFORM_ID);
  private ngZone = inject(NgZone);

  seconde = signal(0);
  minutes = signal(0);
  hours = signal(0);
  daysLeft = signal(0);

  targetDateTimeString = signal(this.eventConfig.getTargetDateTimeString());
  countdownRunning = signal(false);
  isEventPast = signal(false);
  isEventOngoing = signal(false);
  eventStatus = signal<'loading' | 'upcoming' | 'ongoing' | 'past' | 'error'>('loading');

  // Successive & Multi-day Context Signals
  targetTitle = signal("L'événement commence dans");
  targetSubTitle = signal('');
  targetBadge = signal<string | null>(null);
  activeDayBadge = signal('En direct');
  activeDayLocation = signal('');

  private countdownInterval: any;
  private confettiTimeouts: any[] = [];
  private endTime = 0;
  private readonly STORAGE_KEY = 'countdown_end_time';

  constructor() {
    this.evaluateEventStatus();

    effect(() => {
      // Re-evaluate whenever status or event document changes
      this.eventConfig.status();
      this.eventConfig.eventDocument();
      this.evaluateEventStatus();
    });
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.evaluateEventStatus();
      this.triggerConfetti();
    }
  }

  evaluateEventStatus(): void {
    // 0. Handle data loading state to prevent premature "Édition terminée"
    const serviceStatus = this.eventConfig.status();
    if (serviceStatus === 'loading') {
      this.eventStatus.set('loading');
      this.isEventPast.set(false);
      this.isEventOngoing.set(false);
      this.countdownRunning.set(false);
      return;
    }

    if (serviceStatus === 'error' && !this.eventConfig.eventDocument()) {
      this.eventStatus.set('error');
      this.isEventPast.set(false);
      this.isEventOngoing.set(false);
      this.countdownRunning.set(false);
      return;
    }

    const config = this.eventConfig.getConfig();
    const festivalDays: FestivalDaySchedule[] = this.eventConfig.getFestivalDays(config);
    const now = Date.now();

    if (!festivalDays || festivalDays.length === 0) {
      this.stopInterval();
      this.eventStatus.set('past');
      this.isEventPast.set(true);
      this.isEventOngoing.set(false);
      this.countdownRunning.set(false);
      this.resetTimeSignals();
      return;
    }

    // 1. Check if ANY day of the current edition is currently active (ongoing: start <= now < end)
    const activeDay = festivalDays.find((d) => now >= d.startMs && now < d.endMs);
    if (activeDay) {
      this.stopInterval();
      this.eventStatus.set('ongoing');
      this.isEventPast.set(false);
      this.isEventOngoing.set(true);
      this.countdownRunning.set(false);
      this.activeDayBadge.set(festivalDays.length > 1 ? `${activeDay.name} en direct` : 'Événement en direct');
      this.activeDayLocation.set(activeDay.location);
      this.resetTimeSignals();
      return;
    }

    // 2. Check if there is an upcoming day in the CURRENT event edition (start > now)
    const nextUpcomingDay = festivalDays.find((d) => d.startMs > now);
    if (nextUpcomingDay) {
      this.eventStatus.set('upcoming');
      this.isEventPast.set(false);
      this.isEventOngoing.set(false);
      this.countdownRunning.set(true);
      this.endTime = nextUpcomingDay.startMs;

      if (nextUpcomingDay.dayNumber === 1) {
        this.targetTitle.set(
          festivalDays.length > 1 ? 'Le Jour 1 commence dans' : "L'événement commence dans",
        );
        this.targetSubTitle.set(
          'Rendez-vous pour une expérience technologique unique.',
        );
        this.targetBadge.set(
          festivalDays.length > 1 ? `Jour 1 / ${festivalDays.length}` : 'Bientôt disponible',
        );
      } else {
        // Successive Day in Multi-day Festival (e.g. Day 1 has ended, Day 2 is next!)
        this.targetTitle.set(`Le ${nextUpcomingDay.name} commence dans`);
        this.targetSubTitle.set(
          'Préparez-vous pour la suite des sessions et ateliers.',
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
    this.eventStatus.set('past');
    this.isEventPast.set(true);
    this.isEventOngoing.set(false);
    this.countdownRunning.set(false);
    this.resetTimeSignals();
  }

  private startInterval(): void {
    this.stopInterval();
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.ngZone.runOutsideAngular(() => {
      this.countdownInterval = setInterval(() => {
        this.updateTimeDisplay();
      }, 1000);
    });
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

  private triggerConfetti(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    try {
      // Respect prefers-reduced-motion: skip animation entirely if user prefers it
      if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
      }
    } catch {
      // Ignore matchMedia access errors in strict sandboxes
    }

    // Cancel any in-flight confetti from a previous navigation before starting a new burst
    for (const t of this.confettiTimeouts) clearTimeout(t);
    this.confettiTimeouts = [];

    // Lazy load confetti outside Angular zone to avoid triggering unnecessary change detection
    this.ngZone.runOutsideAngular(async () => {
      try {
        const confettiModule = await import('canvas-confetti');
        const confetti = confettiModule.default || confettiModule;

        // Iconic Google colors + white highlight
        const googleColors = ['#4285F4', '#EA4335', '#FBBC04', '#34A853', '#FFFFFF'];

        // Stage 1: Burst from left & right sides
        const t1 = setTimeout(() => {
          confetti({
            particleCount: 50,
            angle: 60,
            spread: 55,
            origin: { x: 0.12, y: 0.72 },
            colors: googleColors,
            ticks: 200,
            gravity: 1.1,
            scalar: 0.9,
            disableForReducedMotion: true,
          });
          confetti({
            particleCount: 50,
            angle: 120,
            spread: 55,
            origin: { x: 0.88, y: 0.72 },
            colors: googleColors,
            ticks: 200,
            gravity: 1.1,
            scalar: 0.9,
            disableForReducedMotion: true,
          });
        }, 300);
        this.confettiTimeouts.push(t1);

        // Stage 2: Gentle raining particles from top center
        const t2 = setTimeout(() => {
          confetti({
            particleCount: 40,
            spread: 80,
            origin: { x: 0.5, y: 0.2 },
            colors: googleColors,
            ticks: 180,
            gravity: 0.85,
            scalar: 0.8,
            disableForReducedMotion: true,
          });
        }, 750);
        this.confettiTimeouts.push(t2);
      } catch {
        // Safe fallback if confetti module cannot load
      }
    });
  }

  formatTime(value: number): string {
    return String(value).padStart(2, '0');
  }

  ngOnDestroy(): void {
    this.stopInterval();
    for (const t of this.confettiTimeouts) {
      clearTimeout(t);
    }
    this.confettiTimeouts = [];
    if (isPlatformBrowser(this.platformId)) {
      import('canvas-confetti').then((m) => {
        const c = m.default || m;
        try { c.reset(); } catch {}
      }).catch(() => {});
    }
  }

  NowDate = new Date();
  eventDay = this.eventConfig.getEventDay();

  engagementYear = this.eventConfig.engagementYear;
  impactStats = this.eventConfig.impactStats;
  supports = this.eventConfig.supports;
  registrationUrl = this.eventConfig.registrationUrl;
}

