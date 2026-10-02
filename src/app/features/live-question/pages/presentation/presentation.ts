import {
  Component,
  inject,
  PLATFORM_ID,
  signal,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { Timestamp } from '@angular/fire/firestore';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FirestoreService } from '../../../../core/firestore/firestore.service';
import { EventConfigService } from '../../../event/services/event-config.service';
import { FloatingReaction } from '../../models/live-question.model';
import { LiveSession } from '../../models/live-session.model';
import { QuestionsSlides } from './quetsions-slides/quetsions-slides';
@Component({
  selector: 'app-presentation',
  imports: [CommonModule, FormsModule, RouterLink, QuestionsSlides],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:mousemove)': 'onMouseMove($event)',
    '(document:mouseup)': 'onMouseUp()',
  },
  templateUrl: "presentation.html",
  styles: `
    @keyframes moveX {
      0%,
      100% {
        transform: translateX(0);
      }
      50% {
        transform: translateX(10px);
      }
    }
    .move1 {
      animation: moveX 6s ease-in-out infinite;
    }
    .move2 {
      animation: moveX 8s ease-in-out infinite reverse;
    }

    /* Pulser le cercle */
    @keyframes pulseAnim {
      0%,
      100% {
        r: 60;
        opacity: 0.7;
      }
      50% {
        r: 70;
        opacity: 1;
      }
    }
    .pulse {
      animation: pulseAnim 4s ease-in-out infinite;
    }

    /* Flotter verticalement les symboles de code */
    @keyframes floatY {
      0%,
      100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(-15px);
      }
    }
    .float {
      animation: floatY 5s ease-in-out infinite;
    }

    /* Rotation douce pour motifs africains */
    @keyframes rotateAnim {
      0% {
        transform: rotate(0deg);
        transform-origin: 620px 300px;
      }
      50% {
        transform: rotate(15deg);
      }
      100% {
        transform: rotate(0deg);
      }
    }
    .animate-fade-in {
      animation: fadeIn 0.25s ease-in-out;
    }
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: scale(0.95);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }

    /* Cadre avec les 4 couleurs Google */
    .question-card {
      border: 1px solid transparent;
      border-radius: 5px;
      border-top: 2px solid #4285f4; /* bleu */
      border-right: 2px solid #ea4335; /* rouge */
      border-bottom: 2px solid #fbbc04; /* jaune */
      border-left: 2px solid #34a853; /* vert */
    }
  `,
})
export default class Presentation {
  sessions: any[] = [];
  private fs = inject(FirestoreService);
  private cdr = inject(ChangeDetectorRef);
  eventConfig = inject(EventConfigService);
  speakersSub!: Subscription;
  selectedSlide: string = '';

  selectedSession: LiveSession<Timestamp> | null = null;
  isMinimized = false;
  isVisible = true;
  popupWindow: Window | null = null;

  // Position de la bulle
  position = { x: 20, y: 20 };
  dragging = false;
  dragOffset = { x: 0, y: 0 };
  private sanitizer = inject(DomSanitizer);
  safeSlideUrl: SafeResourceUrl | null = null;
  private platformId = inject(PLATFORM_ID);
  showReactionPicker = false;
  activeReactions = signal<FloatingReaction[]>([]);
  private animationClasses = [
    'animate-float-slow',
    'animate-float-medium',
    'animate-float-fast',
    'animate-float-left',
    'animate-float-right',
  ];
  emojisSub!: Subscription;
  remoteStateSub!: Subscription;
  private questionsSub?: Subscription;
  firstConnexion = false;

  ngOnInit(): void {
    const active = this.sessions.find((s) => s.isActive);
    this.emojisSub = this.fs.getEmojis().subscribe((emojis: any) => {
      if (this.firstConnexion === true) {
        if (emojis) {
          this.triggerFloatingReaction(emojis[emojis.length - 1].emoji);
        }
      }
      this.firstConnexion = true;
    });
    this.remoteStateSub = this.fs.getStateRemote().subscribe((states: any) => {
      if (states && states.length > 0) {
        const state = states[states.length - 1];
        if (state.command === 'next') {
          this.selectedSlide = this.getUrl(this.selectedSession?.slides!)!;
        } else if (state.command === 'previous') {
          this.selectedSlide = this.getUrl(this.selectedSession?.slides!)!;
        }
      }
    });
    if (active) this.selectedSession = active;

    this.speakersSub = this.fs.getSessions().subscribe((sessions: any) => {
      this.sessions = sessions || [];

      if (isPlatformBrowser(this.platformId)) {
        const selectedId = sessionStorage.getItem('selectedSession');
        if (selectedId) {
          const found = this.sessions.find((s) => s.id?.toString() === selectedId);
          if (found) {
            this.selectedSession = found;
            this.watchQuestions(found);
            this.updateSlideUrl(found.slides);
          }
        } else if (!this.selectedSession && this.sessions.length > 0) {
          const activeSession = this.sessions.find((s) => s.isActive) || this.sessions[0];
          if (activeSession) {
            this.selectedSession = activeSession;
            this.watchQuestions(activeSession);
            this.updateSlideUrl(activeSession.slides);
          }
        }
      }
    });
  }

  triggerFloatingReaction(emoji: string): void {
    // Position de départ aléatoire en bas de l'écran
    const startX = Math.random() * (window.innerWidth - 100) + 50;
    const startY = 100; // Commence en bas

    // Animation aléatoire
    const randomAnimation =
      this.animationClasses[Math.floor(Math.random() * this.animationClasses.length)];

    const reaction: FloatingReaction = {
      id: Date.now().toString() + Math.random(),
      emoji,
      startX,
      startY,
      animationClass: randomAnimation,
    };

    // Ajouter la réaction
    this.activeReactions.update((reactions) => [...reactions, reaction]);

    // Supprimer après l'animation (3-5 secondes)
    setTimeout(
      () => {
        this.activeReactions.update((reactions) => reactions.filter((r) => r.id !== reaction.id));
      },
      3000 + Math.random() * 2000,
    );
  }

  getSafeUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
  statusChange() {
    this.isActive = !this.isActive;
  }

  // Drag events
  startDrag(event: MouseEvent) {
    if (this.isMinimized) {
      this.dragging = true;
      this.dragOffset = {
        x: event.clientX - this.position.x,
        y: event.clientY - this.position.y,
      };
    }
  }
  onSessionChange(session: LiveSession<Timestamp> | null) {
    this.selectedSession = session;
    if (session) {
      this.watchQuestions(session);
      this.updateSlideUrl(session.slides);
    } else {
      this.updateSlideUrl(null);
    }
    this.isVisible = true;
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.setItem('selectedSession', this.selectedSession?.id ?? '');
    }
  }

  updateSlideUrl(rawUrl: string | undefined | null): void {
    const url = this.getUrl(rawUrl);
    this.selectedSlide = url || '';
    this.safeSlideUrl = url ? this.sanitizer.bypassSecurityTrustResourceUrl(url) : null;
    this.cdr.markForCheck();
  }

  private watchQuestions(session: LiveSession<Timestamp>): void {
    this.questionsSub?.unsubscribe();
    this.questionsSub = this.fs.getQuestions(session.id).subscribe((questions: any[]) => {
      if (this.selectedSession?.id === session.id) {
        this.selectedSession = {
          ...session,
          questions: [...questions, ...(session.questions ?? [])],
        };
        this.cdr.markForCheck();
      }
    });
  }

  onMouseMove(event: MouseEvent) {
    if (this.dragging && this.isMinimized) {
      this.position = {
        x: event.clientX - this.dragOffset.x,
        y: event.clientY - this.dragOffset.y,
      };
      this.cdr.markForCheck();
    }
  }

  onMouseUp() {
    this.dragging = false;
  }
  isActive = true;

  getUrl(url: string | undefined | null): string | null {
    if (!url) return null;
    const trimmed = url.trim();
    if (!trimmed) return null;
    const srcMatch = trimmed.match(/src="([^"]+)"/i);
    if (srcMatch && srcMatch[1]) {
      return srcMatch[1];
    }
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    return null;
  }

  // Popup
  openPopup() {
    const popup = window.open(
      '/presenter/popup',
      'devfest-qa-popup',
      'width=400,height=600,top=100,left=100,resizable=yes,scrollbars=yes,status=no,toolbar=no,menubar=no,location=no',
    );
    if (popup) {
      this.popupWindow = popup;
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          this.popupWindow = null;
          clearInterval(checkClosed);
        }
      }, 1000);
    }
  }

  openFullScreen() {
    const elem = document.getElementById('slidesContainer');
    if (elem && elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if ((elem as any).webkitRequestFullscreen) {
      // Safari
      (elem as any).webkitRequestFullscreen();
    } else if ((elem as any).msRequestFullscreen) {
      // IE/Edge
      (elem as any).msRequestFullscreen();
    }
  }

  ngOnDestroy(): void {
    if (this.popupWindow && !this.popupWindow.closed) {
      this.popupWindow.close();
    }
    if (this.speakersSub) this.speakersSub.unsubscribe();
    if (this.emojisSub) this.emojisSub.unsubscribe();
    if (this.remoteStateSub) this.remoteStateSub.unsubscribe();
    if (this.questionsSub) this.questionsSub.unsubscribe();
  }
}
