import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import Questions from '../../components/questions/questions';
import { LiveSession } from '../../models/live-session.model';
import { Timestamp } from '@angular/fire/firestore';
import { FirestoreService } from '../../../../core/firestore/firestore.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-home',
  imports: [CommonModule, Questions],

  template: `
    <!-- ========================== -->
    <!-- HERO SECTION -->
    <!-- ========================== -->
    <section
      class="relative overflow-hidden bg-gradient-to-br from-white via-gray-50 to-gray-100 min-h-[90vh] flex items-center justify-center w-full max-w-full"
    >
      <!-- Background Deco -->
      <div class="absolute inset-0 overflow-hidden opacity-50 animate-fade-in">
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
      <div class="relative z-10 max-w-5xl mx-auto px-6 sm:px-8 text-center space-y-10">
        <!-- Badge -->
        <div
          class="inline-flex items-center gap-2 px-4 py-2 bg-[#4285F4]/10 text-[#4285F4] rounded-full text-sm font-medium animate-slide-down"
          style="animation-delay:0.1s;"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="w-4 h-4 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.77
              9.77 0 01-4-.8l-4 1 1-3.6A7.7 7.7 0 013 12c0-4.418 4.03-8 9-8s9
              3.582 9 8z"
            />
          </svg>
          <span> Questions en temps réel</span>
        </div>

        <!-- Heading -->
        <div class="animate-slide-up" style="animation-delay:0.2s;">
          <h1 class="text-5xl sm:text-6xl md:text-7xl font-bold text-gray-900 leading-tight mb-4">
            Posez vos questions
            <span class="block text-[#34A853] mt-3">anonymement</span>
          </h1>
          <p class="text-lg md:text-xl text-gray-600 font-light max-w-3xl mx-auto leading-relaxed">
            Sélectionnez une session ci-dessous et posez votre question en toute confidentialité.
            Vos messages sont transmis en temps réel aux intervenants.
          </p>
        </div>

        <!-- CTA -->
        <div class="animate-slide-up" style="animation-delay:0.8s;">
          <a
            href="question-space"
            class="inline-flex items-center gap-3 px-8 py-3 rounded-full bg-[#EA4335] text-white text-lg font-semibold hover:bg-[#d83b2e] hover:shadow-lg transform hover:scale-105 transition-all duration-300"
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
    <main class="w-full max-w-full overflow-x-hidden mx-auto px-4 py-16 relative z-10 bg-gradient-to-b">
      <div class="text-center mb-16">
        <h2 class="text-4xl md:text-5xl font-bold text-gray-900">
          🎤 Speakers en <span class="text-[#4285F4]">live</span>
        </h2>

        <div class="flex justify-center mt-6">
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

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 max-w-5xl mx-auto">
        @for (session of activeSessions; track $index) {
          <div
            (click)="openDialog(session)"
            class="group relative shadow-2xl p-6 rounded-2xl  overflow-hidden cursor-pointer transition-all duration-500 hover:shadow-2xl hover:-translate-y-2"
          >
            <div
              class="absolute inset-0 bg-gradient-to-tr from-[#4285F4]/10 via-[#34A853]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            ></div>

            <div class="relative z-10 flex flex-col items-center text-center space-y-3">
              <img
                [src]="'assets/devfest.png'"
                alt="{{ session.speaker }}"
                class="w-40 h-40 rounded-lg object-cover shadow-lg border-4 border-white mb-3"
              />
              <h3 class="text-xl font-bold text-gray-900">{{ session.speaker }}</h3>
              <p class="text-gray-600 text-sm mb-3">{{ session.title }}</p>
              <button
                class="px-5 py-2.5 rounded-md text-white font-semibold hover:scale-105 transition-transform duration-300"
                [ngStyle]="{ 'background-color': getTrackColor('Infrastructure') }"
                (click)="openDialog(session)"
              >
                Poser une question
              </button>
            </div>
          </div>
        }
      </div>
    </main>

    <!-- ========================== -->
    <!-- DIALOG COMPONENT -->
    <!-- ========================== -->
    @if (dialogOuvert) {
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
  private sessionsSub?: Subscription;

  ngOnInit(): void {
    this.sessionsSub = this.FireStore.getActiveSessions().subscribe(
      (sessions: LiveSession<Timestamp>[]) => {
        this.activeSessions = sessions;
      },
    );
  }
  private readonly FireStore = inject(FirestoreService);
  // Fake data pour tester
  dialogOuvert = false;

  activeSessions: LiveSession<Timestamp>[] = [];

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

  SelectedSession!: LiveSession<Timestamp>;

  openDialog(session: LiveSession<Timestamp>) {
    this.SelectedSession = session;
    this.dialogOuvert = true;
  }

  ngOnDestroy(): void {
    this.sessionsSub?.unsubscribe();
  }
}
