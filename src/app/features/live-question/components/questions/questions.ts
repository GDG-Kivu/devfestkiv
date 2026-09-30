import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { LiveQuestion } from '../../models/live-question.model';
import { FirestoreService } from '../../../../core/firestore/firestore.service';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { Subscription } from 'rxjs';
import { Skeleton } from '../../../../shared/components/skeleton/skeleton';

@Component({
  selector: 'app-questions',
  standalone: true,
  imports: [CommonModule, FormsModule, Skeleton],
  template: `
    <!-- Overlay Backdrop -->
    <div class="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-6 animate-fade-in">
      <!-- Main Dialog Box -->
      <div class="relative bg-white rounded-3xl shadow-2xl p-6 sm:p-8 animate-pop-in w-full max-w-2xl sm:max-w-3xl border border-gray-100 max-h-[90vh] flex flex-col justify-between overflow-hidden">
        
        <!-- Header with Close Button -->
        <div class="relative pb-4 border-b border-gray-100 flex-shrink-0">
          <button
            type="button"
            (click)="onClose()"
            class="absolute -top-2 -right-2 text-gray-400 hover:text-gray-700 w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition cursor-pointer text-lg font-bold"
            aria-label="Fermer"
          >
            ✕
          </button>

          <div class="text-center">
            <h2 class="text-2xl sm:text-3xl font-extrabold text-gray-900">Posez votre question</h2>
            @if (sessionTitle) {
              <div class="mt-1.5">
                <span class="text-xs text-gray-500 uppercase tracking-wider font-semibold">Session :</span>
                <span class="text-sm font-bold text-[#4285F4] ml-1.5">{{ sessionTitle }}</span>
              </div>
            }
          </div>

          <!-- Google Color Accent Line -->
          <div class="flex justify-center mt-3">
            <svg width="200" height="18" viewBox="0 0 200 20" fill="none">
              <path
                d="M20,10 L40,5 L60,10 L80,5 L100,10 L120,5 L140,10 L160,5 L180,10"
                stroke="#FBBC04"
                stroke-width="2"
                fill="none"
              />
              <circle cx="30" cy="10" r="2.5" fill="#4285F4" />
              <circle cx="70" cy="10" r="2.5" fill="#EA4335" />
              <circle cx="110" cy="10" r="2.5" fill="#34A853" />
              <circle cx="150" cy="10" r="2.5" fill="#FBBC04" />
            </svg>
          </div>
        </div>

        <!-- Scrollable Questions List Area -->
        <div class="my-4 overflow-y-auto flex-1 pr-1 space-y-4 max-h-[45vh]">
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
              <svg class="w-4 h-4 text-[#4285F4]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.77 9.77 0 01-4-.8l-4 1 1-3.6A7.7 7.7 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
              </svg>
              <span>Questions posées</span>
            </h3>
            <span class="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full font-mono">
              {{ questions.length }} question(s)
            </span>
          </div>

          <!-- Skeleton while loading questions from Firestore -->
          @if (questionsLoading()) {
            <app-skeleton variant="questions" [count]="2" />
          } @else if (questions.length > 0) {
            <div class="space-y-3">
              @for (q of questions; track $index) {
                <div class="question-card p-3.5 sm:p-4 rounded-xl text-gray-800 shadow-2xs bg-white border border-gray-100 transition hover:shadow-xs">
                  <div class="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                    <span class="font-bold text-gray-800 flex items-center gap-1.5">
                      <span class="w-2 h-2 rounded-full bg-[#34A853]"></span>
                      {{ q.displayName || 'Participant Anonyme' }}
                    </span>
                    @if (q.time) {
                      <span class="text-[11px] text-gray-400 font-mono">{{ q.time | date:'shortTime' }}</span>
                    }
                  </div>
                  <p class="text-sm sm:text-base text-gray-800 leading-relaxed">{{ q.contenu }}</p>
                </div>
              }
            </div>
          } @else {
            <div class="p-8 text-center bg-gray-50/70 rounded-2xl border border-dashed border-gray-200">
              <p class="text-xs sm:text-sm text-gray-500 italic">
                Aucune question posée pour l'instant. Soyez le premier à poser une question à l'intervenant !
              </p>
            </div>
          }
        </div>

        <!-- Question Form Section (Always available, frictionless anonymous/authenticated submission) -->
        <div class="pt-3 border-t border-gray-100 flex-shrink-0">
          <form #QuestionForm="ngForm" (ngSubmit)="addQuestion(QuestionForm)" class="space-y-3">
            <div class="flex items-center justify-between text-xs text-gray-500">
              <div class="flex items-center gap-2">
                @if (isGoogleUser()) {
                  <span class="flex items-center gap-1.5 text-blue-700 font-medium">
                    <span class="w-2 h-2 rounded-full bg-blue-500"></span>
                    Poser en tant que <strong>{{ currentUserName() }}</strong>
                  </span>
                } @else {
                  <span class="flex items-center gap-1.5 text-green-700 font-medium bg-green-50 px-2.5 py-0.5 rounded-full border border-green-200/60">
                    <span class="w-2 h-2 rounded-full bg-[#34A853]"></span>
                    Mode Anonyme
                  </span>
                }
              </div>
              <span class="text-[11px] text-gray-400 font-mono">
                {{ 1000 - QuestionFormValue.length }} caractères restants
              </span>
            </div>

            <!-- Optional pseudonym for anonymous participants -->
            @if (!isGoogleUser()) {
              <div>
                <input
                  type="text"
                  name="customAuthorName"
                  [(ngModel)]="customAuthorName"
                  maxlength="50"
                  placeholder="Votre prénom ou pseudo (optionnel, 'Anonyme' par défaut)"
                  class="w-full border border-gray-200 rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-[#4285F4]/30 focus:border-[#4285F4] focus:outline-none transition bg-gray-50/40 focus:bg-white placeholder:text-gray-400 placeholder:font-normal"
                />
              </div>
            }

            <textarea
              [(ngModel)]="QuestionFormValue"
              #questionField="ngModel"
              required
              rows="3"
              name="question"
              maxlength="1000"
              placeholder="Écrivez votre question ici en direct..."
              class="w-full border border-gray-300 rounded-2xl p-3.5 text-sm sm:text-base focus:ring-2 focus:ring-[#4285F4]/40 focus:border-[#4285F4] focus:outline-none resize-none transition bg-gray-50/30 focus:bg-white placeholder:text-gray-400 placeholder:font-normal"
            ></textarea>

            @if (errorMsg) {
              <div class="text-xs font-semibold text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">
                {{ errorMsg }}
              </div>
            }

            <div class="flex items-center justify-between gap-3 pt-1">
              <button
                type="button"
                (click)="onClose()"
                class="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition cursor-pointer"
              >
                Fermer
              </button>

              <button
                type="submit"
                [disabled]="!QuestionFormValue.trim() || isSubmitting"
                class="flex items-center gap-2 px-6 py-2.5 bg-[#4285F4] hover:bg-[#3367D6] disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-sm shadow-xs hover:shadow-md transition cursor-pointer"
              >
                @if (isSubmitting) {
                  <svg class="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Envoi...</span>
                } @else {
                  <span>Envoyer la question</span>
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes popIn {
      from { opacity: 0; transform: scale(0.96); }
      to { opacity: 1; transform: scale(1); }
    }
    .animate-fade-in {
      animation: fadeIn 0.2s ease-in-out;
    }
    .animate-pop-in {
      animation: popIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .question-card {
      border-left: 3px solid #4285f4;
    }
  `,
})
export default class QuestionsDialog implements OnInit, OnDestroy {
  @Input() sessionTitle: string = '';
  @Input() sessionId = '';
  @Input() initialQuestions: LiveQuestion[] = [];

  @Output() close = new EventEmitter<void>();

  readonly auth = inject(AuthService);
  private readonly firestore = inject(FirestoreService);
  private questionsSub?: Subscription;

  errorMsg: string = '';
  QuestionFormValue: string = '';
  customAuthorName: string = '';
  questions: LiveQuestion[] = [];
  isSubmitting = false;
  readonly questionsLoading = signal(true);

  ngOnInit() {
    this.questions = [...this.initialQuestions];
    if (this.sessionId) {
      this.questionsLoading.set(true);
      this.questionsSub = this.firestore
        .getQuestions(this.sessionId)
        .subscribe((questions: LiveQuestion[]) => {
          this.questions = questions || [];
          this.questionsLoading.set(false);
        });
    } else {
      this.questionsLoading.set(false);
    }
  }

  isGoogleUser(): boolean {
    const user = this.auth.user();
    return !!user && !user.isAnonymous;
  }

  currentUserName(): string {
    const user = this.auth.user();
    if (!user) return 'Participant';
    return user.displayName || user.email?.split('@')[0] || 'Participant';
  }

  async addQuestion(form: NgForm) {
    const contenu = this.QuestionFormValue.trim();
    if (!form.valid || !contenu) {
      this.errorMsg = 'Veuillez rédiger votre question avant de l\'envoyer.';
      return;
    }
    if (!this.sessionId) {
      this.errorMsg = 'Impossible d\'identifier la session sélectionnée.';
      return;
    }

    this.errorMsg = '';
    this.isSubmitting = true;

    try {
      // Ensure auth session is ready (Google session preserved, or anonymous created)
      const user = await this.auth.ensureAnonymousOrAuthenticated();
      
      const authorName = this.isGoogleUser()
        ? this.currentUserName()
        : (this.customAuthorName.trim() || 'Participant Anonyme');

      const newQuestion: any = {
        uid: user?.uid || '',
        contenu,
        displayName: authorName,
        time: Date.now().toString(),
        status: 'pending',
        reactions: [],
      };

      await this.firestore.addQuestion(this.sessionId, newQuestion);
      this.QuestionFormValue = '';
      this.customAuthorName = '';
    } catch (error: any) {
      this.errorMsg =
        error instanceof Error && error.message.includes('limit')
          ? 'Vous avez atteint la limite maximale de questions pour cet événement.'
          : error?.message || 'La question n\'a pas pu être envoyée. Veuillez réessayer.';
    } finally {
      this.isSubmitting = false;
    }
  }

  onClose() {
    this.close.emit();
  }

  ngOnDestroy(): void {
    this.questionsSub?.unsubscribe();
  }
}

