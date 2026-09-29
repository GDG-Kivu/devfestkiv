import { Component, OnDestroy, OnInit, signal, inject, PLATFORM_ID } from '@angular/core';
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
  private eventConfig = inject(EventConfigService);
  private platformId = inject(PLATFORM_ID);

  seconde = signal(0);
  minutes = signal(0);
  hours = signal(0);
  daysLeft = signal(0);

  targetDateTimeString = signal(this.eventConfig.getTargetDateTimeString());
  countdownRunning = signal(false);

  private countdownInterval: any;
  private endTime = 0;
  private readonly STORAGE_KEY = 'countdown_end_time';

  ngOnInit(): void {
    // Scroll to top when component initializes

    if (isPlatformBrowser(this.platformId)) {
      this.initializeCountdown();
      this.startCountdown();
    }
  }

  private initializeCountdown(): void {
    const storedEndTime = localStorage.getItem(this.STORAGE_KEY);
    const now = Date.now();

    if (storedEndTime) {
      this.endTime = parseInt(storedEndTime, 10);
      if (this.endTime <= now) {
        this.finishCountdown();
      } else {
        this.countdownRunning.set(true);
        this.updateTimeDisplay();
        this.startInterval();
      }
    } else {
      this.countdownRunning.set(false);
    }
  }

  startCountdown(): void {
    const now = Date.now();
    if (!this.targetDateTimeString()) {
      alert('Veuillez choisir une date et une heure avant de démarrer !');
      return;
    }

    const target = new Date(this.targetDateTimeString()).getTime();
    if (isNaN(target) || target <= now) {
      alert('La date du jour J doit être dans le futur !');
      return;
    }
    this.endTime = target;
    localStorage.setItem(this.STORAGE_KEY, this.endTime.toString());

    this.updateEventDayFromTarget();

    this.countdownRunning.set(true);

    this.updateTimeDisplay();
    this.startInterval();
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
      this.finishCountdown();
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

  private finishCountdown(): void {
    this.stopInterval();
    this.countdownRunning.set(false);

    this.daysLeft.set(0);
    this.hours.set(0);
    this.minutes.set(0);
    this.seconde.set(0);

    localStorage.removeItem(this.STORAGE_KEY);
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
