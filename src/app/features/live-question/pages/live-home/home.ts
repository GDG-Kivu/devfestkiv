import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import Questions from '../../components/questions/questions';
import { LiveSession } from '../../models/live-session.model';
import { Timestamp } from '@angular/fire/firestore';
import { FirestoreService } from '../../../../core/firestore/firestore.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterLink, Questions],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- ========================== -->
    <!-- HERO SECTION -->
    <!-- ========================== -->
    <section
      class="relative overflow-hidden bg-gradient-to-br from-white via-gray-50 to-gray-100 py-12 sm:py-20 md:py-24 min-h-[65vh] sm:min-h-[75vh] flex items-center justify-center w-full max-w-full px-4 sm:px-6 md:px-8"
    >
      <!-- Background Deco -->
      <div class="absolute inset-0 overflow-hidden opacity-50 animate-fade-in pointer-events-none">
        <div
          class="absolute -top-40 -right-40 w-96 h-96 bg-[#4285F4]/20 rounded-full blur-3xl animate-pulse-slow"
        ></div>
        <div
          class="absolute -bottom-40 -left-40 w-[28rem] h-[28rem] bg-[#34A853]/20 rounded-full blur-3xl animate-pulse-slow"
        ></div>
        <div
          class="absolute top-[40%] left-[45%] w-64 h-64 bg-[#FBBC04]/10 rounded-full blur-3xl animate-pulse-slow"
        ></div>
      </div>

      <!-- Hero Content -->
      <div class="relative z-10 max-w-4xl mx-auto text-center space-y-6 sm:space-y-8">
        <!-- Heading -->
        <div class="animate-slide-up" style="animation-delay:0.2s;">
          <h1
            class="text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 tracking-tight leading-tight mb-4"
          >
            Posez vos questions
            <span class="block text-[#34A853] mt-2 sm:mt-3 break-words">anonymement</span>
          </h1>
          <p
            class="text-sm sm:text-base md:text-lg text-gray-600 font-normal max-w-2xl mx-auto leading-relaxed px-2"
          >
            Sélectionnez une session ci-dessous et posez votre question en toute confidentialité.
            Vos messages sont transmis en temps réel aux intervenants.
          </p>
        </div>

        <!-- CTA -->
        <div class="animate-slide-up px-2" style="animation-delay:0.6s;">
          <a
            routerLink="/question-space"
            class="inline-flex items-center justify-center gap-2 sm:gap-3 px-6 sm:px-8 py-3.5 rounded-full bg-[#EA4335] text-white text-sm sm:text-base md:text-lg font-semibold hover:bg-[#d83b2e] hover:shadow-xl transform hover:scale-[1.03] active:scale-95 transition-all duration-300 w-full sm:w-auto shadow-md"
          >
            <span>Voir les sessions disponibles</span>
            <svg
              class="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </a>
        </div>
      </div>
    </section>

    <!-- ========================== -->
    <!-- SPEAKERS SECTION -->
    <!-- ========================== -->
    <main
      class="w-full max-w-full overflow-x-hidden mx-auto px-4 sm:px-6 py-12 sm:py-16 relative z-10 bg-gradient-to-b from-gray-50/50 to-white"
    >
      <div class="text-center mb-10 sm:mb-14">
        <h2 class="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900">
          🎤 Speakers en <span class="text-[#4285F4]">live</span>
        </h2>

        <div class="flex justify-center mt-4 sm:mt-6">
          <svg width="200" height="20" viewBox="0 0 200 20" fill="none">
            <path
              d="M20,10 L40,5 L60,10 L80,5 L100,10 L120,5 L140,10 L160,5 L180,10"
              stroke="#FBBC04"
              stroke-width="2"
              fill="none"
            />
            <circle cx="30" cy="10" r="2" fill="#4285F4" />
            <circle cx="70" cy="10" r="2" fill="#EA4335" />
            <circle cx="110" cy="10" r="2" fill="#34A853" />
            <circle cx="150" cy="10" r="2" fill="#FBBC04" />
          </svg>
        </div>
      </div>

      <!-- Loading State -->
      @if (isLoading()) {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          @for (i of [1, 2, 3]; track i) {
            <div
              class="bg-white rounded-xl p-6 border border-gray-100 shadow-sm animate-pulse flex flex-col items-center text-center space-y-4"
            >
              <div class="w-32 h-32 sm:w-36 sm:h-36 rounded-xl bg-gray-100"></div>
              <div class="h-4 bg-gray-100 rounded w-3/4"></div>
              <div class="h-3 bg-gray-100 rounded w-1/2"></div>
              <div class="h-10 bg-gray-100 rounded-lg w-full mt-2"></div>
            </div>
          }
        </div>
      } @else if (activeSessions().length === 0) {
        <!-- Empty State -->
        <div
          class="mx-auto text-center py-12 px-6 bg-white rounded-xl border border-gray-100 shadow-sm"
        >
          <div
            class="w-12 h-12 bg-red-50 text-[#EA4335] rounded-full flex items-center justify-center mx-auto mb-3"
          >
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z"
              />
            </svg>
          </div>
          <h3 class="text-lg font-bold text-gray-900 mb-1">Aucune session en direct</h3>
          <p class="text-sm text-gray-500 mb-6 leading-relaxed">
            Les sessions en cours s'afficheront ici dès qu'un speaker commencera.
          </p>
          <a
            routerLink="/agenda"
            class="inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-[#EA4335] hover:bg-[#d83b2e] text-white text-sm font-semibold transition-colors shadow-xs"
          >
            Voir le programme
          </a>
        </div>
      } @else {
        <!-- Sessions Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          @for (session of activeSessions(); track session.id || $index) {
            <div
              (click)="openDialog(session)"
              class="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col items-center text-center space-y-3"
            >
              <img
                [src]="'assets/devfest.png'"
                alt="{{ session.speaker }}"
                class="w-32 h-32 sm:w-36 sm:h-36 rounded-xl object-cover border border-gray-100"
              />
              <h3 class="text-lg font-bold text-gray-900 line-clamp-1">{{ session.speaker }}</h3>
              <p class="text-gray-600 text-sm line-clamp-2">{{ session.title || session.theme }}</p>
              <button
                class="w-full mt-2 px-5 py-2.5 rounded-full bg-[#EA4335] hover:bg-[#d83b2e] text-white font-semibold text-sm transition-colors shadow-xs cursor-pointer"
                (click)="openDialog(session); $event.stopPropagation()"
              >
                Poser une question
              </button>
            </div>
          }
        </div>
      }
    </main>

    <!-- ========================== -->
    <!-- DIALOG COMPONENT -->
    <!-- ========================== -->
    @if (dialogOuvert && SelectedSession) {
      <app-questions
        [sessionId]="SelectedSession.id"
        [sessionTitle]="SelectedSession.title"
        [initialQuestions]="SelectedSession.questions"
        (close)="dialogOuvert = false"
      ></app-questions>
    }
  `,
  styles: `
    .animate-fade-in {
      animation: fadeIn 1s ease-out forwards;
      opacity: 0;
    }

    .animate-slide-up {
      animation: slideUp 0.8s ease-out forwards;
      opacity: 0;
    }

    .animate-slide-down {
      animation: slideDown 0.8s ease-out forwards;
      opacity: 0;
    }

    .animate-pulse-slow {
      animation: pulseSlow 4s ease-in-out infinite;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 0.4;
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
  `,
})
export default class Home implements OnInit {
  private readonly FireStore = inject(FirestoreService);
  private sessionsSub?: Subscription;

  readonly activeSessions = signal<LiveSession<Timestamp>[]>([]);
  readonly isLoading = signal<boolean>(true);

  dialogOuvert = false;
  SelectedSession!: LiveSession<Timestamp>;

  ngOnInit(): void {
    this.sessionsSub = this.FireStore.getActiveSessions().subscribe({
      next: (sessions: LiveSession<Timestamp>[]) => {
        this.activeSessions.set(sessions || []);
        this.isLoading.set(false);
      },
      error: () => {
        this.activeSessions.set([]);
        this.isLoading.set(false);
      },
    });
  }

  getTrackColor(track: string): string {
    switch (track.toLowerCase()) {
      case 'tech':
        return '#4285F4'; // bleu
      case 'développement':
        return '#34A853'; // vert
      case 'infrastructure':
        return '#EA4335'; // rouge
      default:
        return '#FBBC05'; // jaune
    }
  }

  getQrOptions() {
    return {
      width: 150,
      height: 150,
      type: 'canvas',
      colorDark: ['#4285F4', '#34A853', '#FBBC05', '#EA4335'], // couleurs Google
      colorLight: '#ffffff',
      dotsOptions: { type: 'rounded' },
      cornersSquareOptions: { type: 'extra-rounded' },
    };
  }

  openDialog(session: LiveSession<Timestamp>) {
    this.SelectedSession = session;
    this.dialogOuvert = true;
  }

  ngOnDestroy(): void {
    this.sessionsSub?.unsubscribe();
  }
}
