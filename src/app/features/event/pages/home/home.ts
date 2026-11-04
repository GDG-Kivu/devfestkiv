import {
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
import { toSignal } from '@angular/core/rxjs-interop';
import { of, timer } from 'rxjs';
import { map } from 'rxjs/operators';
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
  private visibilityHandler?: () => void;

  // Single reactive clock: emits current timestamp every second in browser, once on SSR
  private readonly now = toSignal(
    isPlatformBrowser(this.platformId)
      ? timer(0, 1000).pipe(map(() => Date.now()))
      : of(Date.now()),
    { initialValue: Date.now() },
  );

  // Target end timestamp in ms for the active countdown
  targetEndMs = signal(0);
  countdownRunning = signal(false);

  // Remaining ms automatically derived from target and current clock
  readonly remainingMs = computed(() => {
    if (!this.countdownRunning()) {
      return 0;
    }
    const end = this.targetEndMs();
    const current = this.now() ?? Date.now();
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

  private slideshowInterval: any;
  private confettiTimeouts: any[] = [];

  // Hero Slideshow
  heroSlides = [
    { src: '/assets/past_events/first-2.jpg', alt: 'Communauté DevFest Kivu' },
    { src: '/assets/past_events/first-1.jpg', alt: 'Moments DevFest Kivu' },
    { src: '/assets/past_events/second-1.jpg', alt: 'DevFest Kivu en action' },
  ];
  heroSlideIndex = signal(0);

  setHeroSlide(index: number): void {
    this.heroSlideIndex.set(index);
  }

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
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.evaluateEventStatus();
      this.triggerConfetti();
      this.startSlideshow();

      this.visibilityHandler = () => {
        if (document.visibilityState === 'visible') {
          this.evaluateEventStatus();
        }
      };
      document.addEventListener('visibilitychange', this.visibilityHandler);
    }
  }

  private startSlideshow(): void {
    this.ngZone.runOutsideAngular(() => {
      this.slideshowInterval = setInterval(() => {
        this.ngZone.run(() => {
          this.heroSlideIndex.update((i) => (i + 1) % this.heroSlides.length);
        });
      }, 4000);
    });
  }

  private stopSlideshow(): void {
    if (this.slideshowInterval) {
      clearInterval(this.slideshowInterval);
      this.slideshowInterval = null;
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
      this.targetEndMs.set(0);
      return;
    }

    if (serviceStatus === 'error' && !this.eventConfig.eventDocument()) {
      this.eventStatus.set('error');
      this.isEventPast.set(false);
      this.isEventOngoing.set(false);
      this.countdownRunning.set(false);
      this.targetEndMs.set(0);
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
    this.stopSlideshow();
    if (this.visibilityHandler && isPlatformBrowser(this.platformId)) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
      this.visibilityHandler = undefined;
    }
    for (const t of this.confettiTimeouts) {
      clearTimeout(t);
    }
    this.confettiTimeouts = [];
    if (isPlatformBrowser(this.platformId)) {
      import('canvas-confetti')
        .then((m) => {
          const c = m.default || m;
          try {
            c.reset();
          } catch {}
        })
        .catch(() => {});
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
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.toggleFlip(cardId);
    }
  }

  // Hero Fan Card helpers
  // Cards are arranged: left(-1), center(0), right(+1) relative to active index
  private fanOffset(cardIndex: number, activeIndex: number, total: number): number {
    let offset = cardIndex - activeIndex;
    // Wrap around
    if (offset > total / 2) offset -= total;
    if (offset < -total / 2) offset += total;
    return offset;
  }

  getFanTransform(i: number, activeIndex: number): string {
    const n = this.heroSlides.length;
    const offset = this.fanOffset(i, activeIndex, n);
    if (offset === 0) return 'rotate(0deg) translateX(0) scale(1)';
    if (offset === -1 || offset === n - 1) return 'rotate(-6deg) translateX(-28px) scale(0.94)';
    return 'rotate(6deg) translateX(28px) scale(0.94)';
  }

  getFanZIndex(i: number, activeIndex: number): number {
    const n = this.heroSlides.length;
    const offset = Math.abs(this.fanOffset(i, activeIndex, n));
    return 10 - offset;
  }

  getFanOpacity(i: number, activeIndex: number): number {
    const n = this.heroSlides.length;
    const offset = Math.abs(this.fanOffset(i, activeIndex, n));
    return offset === 0 ? 1 : 0.85;
  }

  // Practical Information Accordions State
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
      title: 'Conférences & Keynotes',
      frontDescription:
        'Interventions d’experts locaux et internationaux sur les technologies d’avant-garde.',
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
      title: 'Workshops & Codelabs',
      frontDescription: 'Sessions hands-on immersives pour coder et prototyper en direct.',
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
      title: 'Communauté & Networking',
      frontDescription: 'Rencontrez les talents et bâtisseurs de la scène tech des Grands Lacs.',
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
      title: 'Démos & Défis Tech',
      frontDescription: 'Mise en lumière des innovations conçues au Kivu et pour l’Afrique.',
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
        answer: `Le DevFest Kivu se déroule ${dateRange} à ${venue.conferenceCenter || 'Bukavu'} (${venue.fullLocation || 'RD Congo'}), offrant un cadre exceptionnel. Les sessions débutent dès 09h00.`,
        category: 'Lieu & Dates',
      },
      {
        id: 'faq-2',
        question: "L'accès est-il totalement gratuit ?",
        answer:
          'Oui ! Conformément aux valeurs des communautés GDG, le DevFest Kivu est 100% gratuit et ouvert à tous. Cependant, en raison du nombre limité de places dans la salle de conférence, l’inscription préalable (RSVP) est obligatoire.',
        category: 'Billetterie',
      },
      {
        id: 'faq-3',
        question: 'Dois-je obligatoirement apporter mon ordinateur portable ?',
        answer:
          'Un ordinateur portable est très utile si vous souhaitez coder durant les workshops pratiques et codelabs. Pour assister aux keynotes, panels et conférences d’inspiration, votre curiosité et votre carnet de notes suffisent amplement.',
        category: 'Matériel',
      },
      {
        id: 'faq-4',
        question: 'À qui s’adresse cet événement ?',
        answer:
          'À toute personne passionnée ou curieuse de numérique : développeurs juniors et seniors, étudiants, lycéens, designers UI/UX, entrepreneurs, porteurs de projets et professionnels de la région des Grands Lacs.',
        category: 'Public',
      },
      {
        id: 'faq-5',
        question: 'Comment proposer une conférence ou devenir sponsor ?',
        answer:
          'Les candidatures d’intervenants s’effectuent via le Call for Speakers. Pour soutenir l’événement et mettre en avant votre marque auprès de la jeunesse tech du Kivu, contactez notre équipe via la page Partenaires ou par e-mail à gdgkivu@gmail.com.',
        category: 'Participation',
      },
    ];
  }
}
