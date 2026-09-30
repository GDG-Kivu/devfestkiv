import {
  Component,
  OnInit,
  OnDestroy,
  HostListener,
  inject,
  PLATFORM_ID,
  signal,
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
  template: `
    <div class="relative min-h-screen " id="slidesContainer">
      <!-- Overlay pour les réactions animées -->
      <div class="absolute inset-0 pointer-events-none overflow-hidden z-30">
        @for (reaction of activeReactions(); track reaction.id) {
          <div
            class="absolute text-4xl pointer-events-none animate-float"
            [style.left]="reaction.startX + 'px'"
            [style.bottom]="reaction.startY + 'px'"
            [class]="reaction.animationClass"
          >
            {{ reaction.emoji }}
          </div>
        }
      </div>
      <!-- Slides -->
      @if (isActive) {
        <div class="absolute inset-0 z-0">
          <iframe [src]="safeSlideUrl" frameborder="0" class="w-full h-full"></iframe>
        </div>
      } @else {
        <app-questions-slides [session]="selectedSession" />
      }

      <!-- Bulle quand minimisé -->
      @if (isMinimized && isVisible) {
        <div
          class="fixed z-50 cursor-move select-none animate-fade-in"
          [ngStyle]="{ left: position.x + 'px', top: position.y + 'px' }"
          (mousedown)="startDrag($event)"
        >
          <div
            class="relative w-20 h-20 rounded-full bg-white shadow-2xl flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-125 hover:rotate-6 border-[4px] border-gray-200"
            (click)="isMinimized = false"
          >
            <!-- Halo coloré -->
            <div
              class="absolute inset-0 rounded-full blur-md opacity-70 animate-pulse"
              [ngStyle]="{
                'box-shadow':
                  '0 0 20px 4px rgba(66,133,244,0.7), 0 0 30px 6px rgba(219,68,55,0.5), 0 0 40px 8px rgba(244,180,0,0.5), 0 0 50px 10px rgba(15,157,88,0.5)',
              }"
            ></div>

            <!-- Nombre de questions -->
            <span
              class="relative z-10 font-extrabold text-4xl drop-shadow text-gray-900 select-none"
            >
              {{ selectedSession?.questions?.length || 0 }}
            </span>

            <!-- Petites barres colorées autour pour rappeler les couleurs Google -->
            <div class="absolute -top-1 left-1 w-3 h-3 bg-[#4285F4] rounded-full"></div>
            <div class="absolute -top-1 right-1 w-3 h-3 bg-[#DB4437] rounded-full"></div>
            <div class="absolute -bottom-1 left-1 w-3 h-3 bg-[#F4B400] rounded-full"></div>
            <div class="absolute -bottom-1 right-1 w-3 h-3 bg-[#0F9D58] rounded-full"></div>
          </div>
        </div>
      }

      <!-- Card Q&A -->
      @if (!isMinimized && isVisible) {
        <div class="fixed top-4 right-4 z-10 w-96 max-h-[80vh] flex flex-col">
          <div class="bg-white rounded-lg shadow-2xl border-2 border-gray-200 backdrop-blur-sm">
            <div class="flex items-center justify-between p-3 border-gray-500">
              <div class="flex items-center gap-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                  class="size-6"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5m.75-9 3-3 2.148 2.148A12.061 12.061 0 0 1 16.5 7.605"
                  />
                </svg>
                <div>
                  <h2 class="font-semibold text-sm">Questions en Direct</h2>
                  <p class="text-xs text-gray-500">{{ eventConfig.fullName }}</p>
                </div>
              </div>
              <div class="flex gap-2">
                <button
                  (click)="openFullScreen()"
                  class="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="1.5"
                    stroke="currentColor"
                    class="size-6"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                    />
                  </svg>
                </button>
                <button
                  (click)="isMinimized = true"
                  class="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="1.5"
                    stroke="currentColor"
                    class="size-6"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14" />
                  </svg>
                </button>
                <button
                  (click)="isVisible = false"
                  routerLink="/live_q"
                  class="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="1.5"
                    stroke="currentColor"
                    class="size-6"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div class="p-3 space-y-3 overflow-y-auto">
              <div>
                <label class="text-xs text-gray-500">Session Active</label>
                <select
                  [(ngModel)]="selectedSession"
                  class="w-full border rounded p-2 text-sm"
                  (ngModelChange)="onSessionChange($event)"
                >
                  <option [ngValue]="null">Sélectionner une session</option>
                  @for (s of sessions; track $index) {
                    <option [ngValue]="s">{{ s.title }} - {{ s.speaker }}</option>
                  }
                </select>
                <br />
                <br />
                <div class="flex items-center gap-2 cursor-pointer" (click)="statusChange()">
                  <!-- Switch -->
                  <div
                    class="relative w-12 h-6 rounded-full transition-all duration-300"
                    [ngClass]="isActive ? 'bg-green-500' : 'bg-gray-300'"
                  >
                    <div
                      class="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transform transition-all duration-300"
                      [ngClass]="isActive ? 'translate-x-6' : 'translate-x-0'"
                    ></div>
                  </div>
                  <span
                    class="text-xs font-semibold transition-colors duration-300"
                    [ngClass]="isActive ? 'text-green-600' : 'text-gray-500'"
                  >
                    {{ isActive ? 'Slides' : 'Questions' }}
                  </span>
                </div>
              </div>

              @if (selectedSession) {
                <div>
                  <div class="p-3 bg-gray-100 rounded">
                    <h3 class="font-medium text-sm">{{ selectedSession.title }}</h3>
                    <p class="text-xs text-gray-600">{{ selectedSession.speaker }}</p>
                    <p class="text-xs text-gray-500">{{ selectedSession.time }}</p>
                  </div>

                  <div>
                    <h4 class="font-medium text-sm">
                      Questions ({{ selectedSession.questions.length }})
                    </h4>
                    @if (selectedSession.questions.length === 0) {
                      <div class="text-center py-4 text-gray-400">Aucune question reçue</div>
                    }
                    <div class=" max-h-100 overflow-y-auto">
                      @for (q of selectedSession.questions; track $index) {
                        <div class="p-2 border rounded mb-2 question-card">
                          <div class="flex justify-between text-xs text-gray-500">
                            <span>Q{{ $index + 1 }}</span>
                            <span>{{ q.time | date: 'medium' }} </span>
                          </div>
                          <p class="text-sm mt-1">{{ q.contenu }}</p>
                        </div>
                      }
                    </div>
                  </div>
                </div>
              }
              @if (!selectedSession) {
                <div class="text-center text-gray-400 py-4">Sélectionnez une session active</div>
              }
            </div>
          </div>
        </div>
      }
      <svg
        viewBox="0 0 800 400"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid meet"
        style="width:100%; height:100%; position:absolute; top:0; left:0; z-index:-3;"
      >
        <!-- Formes Google animées -->
        <polygon class="move1" points="100,50 200,150 50,150" fill="#EA4335" fill-opacity="0.2" />
        <circle class="pulse" cx="600" cy="120" r="60" fill="#34A853" fill-opacity="0.3" />

        <!-- Icônes codeur -->
        <text
          class="float"
          x="350"
          y="300"
          font-family="monospace"
          font-size="50"
          fill="#F4B400"
          opacity="0.9"
        >
          &lt;/&gt;
        </text>
        <text
          class="float"
          x="100"
          y="350"
          font-family="monospace"
          font-size="30"
          fill="#EA4335"
          opacity="0.7"
        >
          &#123;DevFest&#125;
        </text>
        <text
          class="float"
          x="200"
          y="70"
          font-family="monospace"
          font-size="25"
          fill="#4285F4"
          opacity="0.7"
        >
          &#40;&#41;
        </text>
        <text
          class="float"
          x="650"
          y="250"
          font-family="monospace"
          font-size="35"
          fill="#34A853"
          opacity="0.7"
        >
          &lt;Kivu/&gt;
        </text>
        <text
          class="float"
          x="500"
          y="350"
          font-family="monospace"
          font-size="20"
          fill="#FBBC05"
          opacity="0.6"
        >
          ;
        </text>
        <text
          class="float"
          x="750"
          y="70"
          font-family="monospace"
          font-size="25"
          fill="#EA4335"
          opacity="0.6"
        >
          #
        </text>
        <text
          class="float"
          x="600"
          y="100"
          font-family="monospace"
          font-size="25"
          fill="#EA4335"
          opacity="0.6"
        >
          ?
        </text>
      </svg>
    </div>
    <svg
      viewBox="0 0 800 400"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
      style="width:100%; height:100%; position:absolute; top:0; left:0; z-index:-3;"
    >
      <!-- Formes Google animées -->
      <polygon class="move1" points="100,50 200,150 50,150" fill="#EA4335" fill-opacity="0.2" />
      <circle class="pulse" cx="600" cy="120" r="60" fill="#34A853" fill-opacity="0.3" />

      <!-- Icônes codeur -->
      <text
        class="float"
        x="350"
        y="300"
        font-family="monospace"
        font-size="50"
        fill="#F4B400"
        opacity="0.9"
      >
        &lt;/&gt;
      </text>
      <text
        class="float"
        x="100"
        y="350"
        font-family="monospace"
        font-size="30"
        fill="#EA4335"
        opacity="0.7"
      >
        &#123;DevFest&#125;
      </text>
      <text
        class="float"
        x="200"
        y="70"
        font-family="monospace"
        font-size="25"
        fill="#4285F4"
        opacity="0.7"
      >
        &#40;&#41;
      </text>
      <text
        class="float"
        x="650"
        y="250"
        font-family="monospace"
        font-size="35"
        fill="#34A853"
        opacity="0.7"
      >
        &lt;Kivu/&gt;
      </text>
      <text
        class="float"
        x="500"
        y="350"
        font-family="monospace"
        font-size="20"
        fill="#FBBC05"
        opacity="0.6"
      >
        ;
      </text>
      <text
        class="float"
        x="750"
        y="70"
        font-family="monospace"
        font-size="25"
        fill="#EA4335"
        opacity="0.6"
      >
        #
      </text>
      <text
        class="float"
        x="600"
        y="100"
        font-family="monospace"
        font-size="25"
        fill="#EA4335"
        opacity="0.6"
      >
        ?
      </text>
    </svg>
  `,
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
      this.sessions = sessions;

      if (isPlatformBrowser(this.platformId)) {
        const selectedId = sessionStorage.getItem('selectedSession');
        if (selectedId) {
          this.selectedSession = this.sessions.find((s) => s.id.toString() === selectedId);
          if (this.selectedSession) this.watchQuestions(this.selectedSession);
          this.selectedSlide = this.getUrl(this.selectedSession?.slides!)!;

          this.safeSlideUrl = this.selectedSlide
            ? this.sanitizer.bypassSecurityTrustResourceUrl(this.selectedSlide)
            : null;
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
    if (session) this.watchQuestions(session);
    this.selectedSlide = this.getUrl(session?.slides!)!;
    this.isVisible = true;
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.setItem('selectedSession', this.selectedSession?.id ?? '');
    }
    this.safeSlideUrl = this.selectedSlide
      ? this.sanitizer.bypassSecurityTrustResourceUrl(this.selectedSlide)
      : null;
  }

  private watchQuestions(session: LiveSession<Timestamp>): void {
    this.questionsSub?.unsubscribe();
    this.questionsSub = this.fs.getQuestions(session.id).subscribe((questions: any[]) => {
      if (this.selectedSession?.id === session.id) {
        this.selectedSession = {
          ...session,
          questions: [...questions, ...(session.questions ?? [])],
        };
      }
    });
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (this.dragging && this.isMinimized) {
      this.position = {
        x: event.clientX - this.dragOffset.x,
        y: event.clientY - this.dragOffset.y,
      };
    }
  }

  @HostListener('document:mouseup')
  onMouseUp() {
    this.dragging = false;
  }
  isActive = true;

  getUrl(url: string) {
    const srcMatch = url.match(/src="([^"]+)"/);

    const src = srcMatch ? srcMatch[1] : null;
    return src;
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
