import {
  afterNextRender,
  ApplicationRef,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  signal,
  untracked,
  NgZone,
} from '@angular/core';
import { of } from 'rxjs';
import { first, map } from 'rxjs/operators';
import PastEventsGallery from '../../components/past-events-gallery/past-events-gallery';
import TshirtShowcase from '../../components/tshirt-showcase/tshirt-showcase';
import { RouterLink } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';
import { EventConfigService, FestivalDaySchedule } from '../../services/event-config.service';
import { FirestoreService } from '../../../../core/firestore/firestore.service';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PastEventsGallery, TshirtShowcase, RouterLink, NgOptimizedImage],
  templateUrl: 'home.html',
  styleUrls: ['home-redesign.css', 'home-sections.css'],
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
      animation: fadeInUp 0.9s ease-out forwards;
      opacity: 0;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
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
  private appRef = inject(ApplicationRef);
  private visibilityHandler?: () => void;

  // Reactive clock: runs outside Angular zone so hydration isStable() is never blocked
  private readonly now = signal(Date.now());
  private clockInterval: any;

  // Target end timestamp in ms for the active countdown
  targetEndMs = signal(0);
  countdownRunning = signal(false);

  // Remaining ms automatically derived from target and current clock
  readonly remainingMs = computed(() => {
    if (!this.countdownRunning()) {
      return 0;
    }
    const end = this.targetEndMs();
    const current = this.now();
    return Math.max(0, end - current);
  });

  // Pure computed countdown units: update automatically with zero manual intervals
  readonly daysLeft = computed(() => Math.floor(this.remainingMs() / (1000 * 3600 * 24)));
  readonly hours = computed(() => Math.floor((this.remainingMs() % (1000 * 3600 * 24)) / (1000 * 3600)));
  readonly minutes = computed(() => Math.floor((this.remainingMs() % (1000 * 3600)) / (1000 * 60)));
  readonly seconde = computed(() => Math.floor((this.remainingMs() % (1000 * 60)) / 1000));

  targetDateTimeString = signal(this.eventConfig.getTargetDateTimeString());
  isEventPast = signal(false);
  isEventOngoing = signal(false);
  eventStatus = signal<'loading' | 'upcoming' | 'ongoing' | 'past' | 'error'>('loading');

  // Successive & Multi-day Context Signals
  targetTitle = signal("L'événement commence dans");
  targetSubTitle = signal('');
  targetBadge = signal<string | null>(null);
  activeDayBadge = signal('En direct');
  activeDayLocation = signal('');

  constructor() {
    this.evaluateEventStatus();

    effect(() => {
      // Re-evaluate whenever status or event document changes
      this.eventConfig.status();
      this.eventConfig.eventDocument();
      this.evaluateEventStatus();
    });

    effect(() => {
      // When countdown reaches 0 while running, transition event status automatically
      if (this.countdownRunning() && this.remainingMs() <= 0 && this.targetEndMs() > 0) {
        untracked(() => {
          this.evaluateEventStatus();
        });
      }
    });

    // Start interval timers promptly after initial browser render without hanging on slow connections
    afterNextRender(() => {
      this.startClock();
    });
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.evaluateEventStatus();

      this.visibilityHandler = () => {
        if (document.visibilityState === 'visible') {
          this.evaluateEventStatus();
        }
      };
      document.addEventListener('visibilitychange', this.visibilityHandler);
    }
  }

  private startClock(): void {
    this.stopClock();
    this.ngZone.runOutsideAngular(() => {
      this.clockInterval = setInterval(() => {
        if (this.countdownRunning()) {
          this.now.set(Date.now());
        }
      }, 1000);
    });
  }

  private stopClock(): void {
    if (this.clockInterval) {
      clearInterval(this.clockInterval);
      this.clockInterval = null;
    }
  }

  evaluateEventStatus(): void {
    if (this.eventConfig.status() === 'loading') {
      this.eventStatus.set('loading');
      return;
    }
    if (this.eventConfig.status() === 'error') {
      this.eventStatus.set('error');
      return;
    }

    const config = this.eventConfig.getConfig();
    const festivalDays: FestivalDaySchedule[] = this.eventConfig.getFestivalDays(config);
    const now = Date.now();

    if (!festivalDays || festivalDays.length === 0) {
      this.eventStatus.set('past');
      this.isEventPast.set(true);
      this.isEventOngoing.set(false);
      this.countdownRunning.set(false);
      this.targetEndMs.set(0);
      return;
    }

    // 1. Check if ANY day of the current edition is currently active (ongoing: start <= now < end)
    const activeDay = festivalDays.find((d) => now >= d.startMs && now < d.endMs);
    if (activeDay) {
      this.eventStatus.set('ongoing');
      this.isEventPast.set(false);
      this.isEventOngoing.set(true);
      this.countdownRunning.set(false);
      this.targetEndMs.set(0);
      this.activeDayBadge.set(
        festivalDays.length > 1 ? `${activeDay.name} en direct` : 'Événement en direct',
      );
      this.activeDayLocation.set(activeDay.location);
      return;
    }

    // 2. Check if there is an upcoming day in the CURRENT event edition (start > now)
    const nextUpcomingDay = festivalDays.find((d) => d.startMs > now);
    if (nextUpcomingDay) {
      this.eventStatus.set('upcoming');
      this.isEventPast.set(false);
      this.isEventOngoing.set(false);
      this.countdownRunning.set(true);
      this.targetEndMs.set(nextUpcomingDay.startMs);

      if (nextUpcomingDay.dayNumber === 1) {
        this.targetTitle.set(
          festivalDays.length > 1 ? 'Le Jour 1 commence dans' : "L'événement commence dans",
        );
        this.targetSubTitle.set('Rendez-vous pour une expérience technologique unique.');
        this.targetBadge.set(
          festivalDays.length > 1 ? `Jour 1 / ${festivalDays.length}` : 'Bientôt disponible',
        );
      } else {
        // Successive Day in Multi-day Festival (e.g. Day 1 has ended, Day 2 is next!)
        this.targetTitle.set(`Le ${nextUpcomingDay.name} commence dans`);
        this.targetSubTitle.set('Préparez-vous pour la suite des sessions et ateliers.');
        this.targetBadge.set(`Jour ${nextUpcomingDay.dayNumber} / ${festivalDays.length}`);
      }

      this.targetDateTimeString.set(nextUpcomingDay.startTime.toISOString().slice(0, 19));
      return;
    }

    // 3. All days of current edition have finished -> Event is past / completed for this edition
    this.eventStatus.set('past');
    this.isEventPast.set(true);
    this.isEventOngoing.set(false);
    this.countdownRunning.set(false);
    this.targetEndMs.set(0);
  }

  formatTime(value: number): string {
    return String(value).padStart(2, '0');
  }

  ngOnDestroy(): void {
    this.stopClock();
    if (this.visibilityHandler && isPlatformBrowser(this.platformId)) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
      this.visibilityHandler = undefined;
    }
  }

  NowDate = new Date();
  eventDay = this.eventConfig.getEventDay();

  engagementYear = this.eventConfig.engagementYear;
  impactStats = this.eventConfig.impactStats;
  supports = this.eventConfig.supports;
  registrationUrl = this.eventConfig.registrationUrl;

  // Illustrations for impact stat cards (cycling through available assets)
  impactIllustrations = [
    '/assets/illustrations/dot.png',
    '/assets/illustrations/threedot.png',
    '/assets/illustrations/bar.png',
    '/assets/illustrations/bracket.png',
  ];

  // 3D Flip Card Interactive State
  flippedCards = signal<Record<string, boolean>>({});

  toggleFlip(cardId: string): void {
    const current = this.flippedCards();
    this.flippedCards.set({
      ...current,
      [cardId]: !current[cardId],
    });
  }

  isFlipped(cardId: string): boolean {
    return !!this.flippedCards()[cardId];
  }

  onCardKeydown(event: KeyboardEvent, cardId: string): void {
    if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      this.toggleFlip(cardId);
    }
  }

  // Practical Information Accordions State
  partnersPaused = signal(false);
  openAccordionId = signal<string | null>('faq-1');

  toggleAccordion(id: string): void {
    this.openAccordionId.set(this.openAccordionId() === id ? null : id);
  }

  isAccordionOpen(id: string): boolean {
    return this.openAccordionId() === id;
  }

  onAccordionKeydown(event: KeyboardEvent, id: string): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.toggleAccordion(id);
    }
  }

  // Interactive Festival Pillars Data (Authentic Kivu & Google Ecosystem)
  festivalPillars = [
    {
      id: 'pillar-conferences',
      title: 'Conférences & échanges',
      frontDescription:
        'Des sessions et des retours d’expérience pour apprendre et partager les connaissances.',
      backDetails:
        'Explorez l’IA générative, le Cloud Computing, le Web moderne et les architectures logicielles avec des retours d’expérience concrets.',
      iconPath: '/assets/micro.png',
      width: 288,
      height: 288,
      cardBg: 'bg-[#f8fafd] border-gray-200/90',
      iconBtnClass: 'bg-black/5 hover:bg-black/10 text-gray-700',
      linkClass: 'text-blue-600 hover:text-blue-800',
      actionLink: '/speakers',
      actionText: 'Voir les intervenants',
      actionExternal: false,
    },
    {
      id: 'pillar-workshops',
      title: 'Ateliers pratiques',
      frontDescription: 'Développement logiciel, sécurité et intelligence artificielle : apprendre en pratiquant.',
      backDetails:
        'Montez en compétences sur Angular, Flutter, Firebase et les outils Google avec l’accompagnement de mentors expérimentés.',
      iconPath: '/assets/illustrations/bracket.png',
      width: 277,
      height: 243,
      cardBg: 'bg-[#fef7e0] border-[#fce8b2]',
      iconBtnClass: 'bg-amber-200/70 hover:bg-amber-300/80 text-amber-900',
      linkClass: 'text-amber-900 hover:text-amber-950',
      actionLink: '/agenda',
      actionText: 'Consulter l’agenda',
      actionExternal: false,
    },
    {
      id: 'pillar-community',
      title: 'Rencontres & opportunités',
      frontDescription: 'Échangez avec les talents, les entreprises et les professionnels de la région.',
      backDetails:
        'Échangez avec des recruteurs, fondateurs de startups congolaises et passionnés de technologie pour créer des opportunités durables.',
      iconPath: '/assets/equipe.png',
      width: 288,
      height: 288,
      cardBg: 'bg-[#e8f0fe] border-[#c2e7ff]',
      iconBtnClass: 'bg-blue-100 hover:bg-blue-200 text-blue-800',
      linkClass: 'text-blue-700 hover:text-blue-900',
      actionLink: 'https://gdg.community.dev/gdg-kivu/',
      actionExternal: true,
      actionText: 'Rejoindre',
    },
    {
      id: 'pillar-innovation',
      title: 'Solutions locales',
      frontDescription: 'Partageons des idées et encourageons des solutions adaptées aux besoins de nos communautés.',
      backDetails:
        'Découvrez des projets et applications innovantes apportant des réponses technologiques réelles aux enjeux économiques et sociaux locaux.',
      iconPath: '/assets/mains.png',
      width: 288,
      height: 288,
      cardBg: 'bg-[#f8fafd] border-gray-200/90',
      iconBtnClass: 'bg-black/5 hover:bg-black/10 text-gray-700',
      linkClass: 'text-blue-600 hover:text-blue-800',
      actionLink: '/agenda',
      actionText: 'Voir les temps forts',
      actionExternal: false,
    },
  ];

  // Practical Information Accordions Data (computed so venue/date are dynamic)
  get practicalInfoItems() {
    const venue = this.eventConfig.venue;
    const dateRange = this.eventConfig.getFormattedDateRange
      ? this.eventConfig.getFormattedDateRange()
      : '4 et 5 Décembre 2026';
    return [
      {
        id: 'faq-1',
        question: 'Où et quand se déroulera le DevFest Kivu ?',
        answer: `Le DevFest Kivu se déroule ${dateRange} à ${venue.conferenceCenter || venue.fullLocation || 'Bukavu'}. Consultez le programme pour les horaires des sessions.`,
        category: 'Lieu & Dates',
      },
      {
        id: 'faq-2',
        question: "Comment participer à l'événement ?",
        answer:
          "Consultez la page d'inscription de l'événement pour connaître les modalités de participation et réserver votre place.",
        category: 'Billetterie',
      },
      {
        id: 'faq-3',
        question: 'Dois-je obligatoirement apporter mon ordinateur portable ?',
        answer:
          'Un ordinateur portable peut être utile pour participer aux ateliers pratiques. Consultez le programme pour les besoins propres à chaque session.',
        category: 'Matériel',
      },
      {
        id: 'faq-4',
        question: 'À qui s’adresse cet événement ?',
        answer:
          'Aux étudiants, développeurs, entrepreneurs, professionnels et à toute personne intéressée par le numérique au Kivu.',
        category: 'Public',
      },
      {
        id: 'faq-5',
        question: 'Comment proposer une conférence ou devenir sponsor ?',
        answer:
          'Pour proposer une intervention ou soutenir les activités de la communauté, contactez notre équipe via la page Contact.',
        category: 'Participation',
      },
    ];
  }
}
