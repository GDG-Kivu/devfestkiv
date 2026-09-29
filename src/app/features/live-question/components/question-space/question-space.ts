import {
  Component,
  inject,
  signal,
  ViewChild,
  ElementRef,
  AfterViewChecked,
  OnDestroy,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { LiveSession } from '../../models/live-session.model';
import { LiveQuestion } from '../../models/live-question.model';
import { FirestoreService } from '../../../../core/firestore/firestore.service';
import { Timestamp } from '@angular/fire/firestore';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';

interface FloatingReaction {
  id: string;
  emoji: string;
  startX: number;
  startY: number;
  animationClass: string;
}

@Component({
  selector: 'app-question-space',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './question-space.component.html',
  styles: [
    `
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
  ],
})
export default class QuestionSpace implements AfterViewChecked, OnDestroy {
  private fs = inject(FirestoreService);
  private auth = inject(AuthService);

  @ViewChild('questionsContainer') questionsContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('scrollAnchor') scrollAnchor!: ElementRef<HTMLDivElement>;

  sessions = signal<LiveSession<Timestamp>[]>([]);
  selectedSession = signal<LiveSession<Timestamp> | null>(null);
  questions = signal<LiveQuestion[]>([]);
  questionText = signal('');
  questionError = signal('');
  showEmojiPanel = signal(false);
  showReactEmojiPanel = signal(false);
  shouldScrollToBottom = signal(true);
  showReactionPicker = false;
  activeReactions = signal<FloatingReaction[]>([]);

  // Emojis disponibles pour les réactions
  availableEmojis = ['👍', '👎', '❤️', '🔥', '🎉', '👀', '😄', '🤔', '🚀'];

  // Animations disponibles pour les réactions flottantes
  private animationClasses = [
    'animate-float-slow',
    'animate-float-medium',
    'animate-float-fast',
    'animate-float-left',
    'animate-float-right',
  ];

  speakersSub!: Subscription;
  private questionsSub?: Subscription;

  ngOnInit(): void {
    this.speakersSub = this.fs.getActiveSessions().subscribe((sessions: any) => {
      this.sessions.set(sessions);
    });
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom()) {
      this.scrollToBottom();
      this.shouldScrollToBottom.set(false);
    }
  }

  selectSession(s: LiveSession<Timestamp>) {
    if (s.isActive) {
      this.selectedSession.set(s);
      this.watchQuestions(s);
      this.shouldScrollToBottom.set(true);
    }
  }

  private watchQuestions(session: LiveSession<Timestamp>): void {
    this.questionsSub?.unsubscribe();
    this.questions.set(session.questions ?? []);
    this.questionsSub = this.fs.getQuestions(session.id).subscribe((questions: LiveQuestion[]) => {
      this.questions.set([...questions, ...(session.questions ?? [])]);
      this.shouldScrollToBottom.set(true);
    });
  }

  onMobileSessionSelect(event: any) {
    const sessionId = event.target.value;
    if (!sessionId) {
      this.selectedSession.set(null);
      return;
    }

    const session = this.sessions().find((s) => s.id === sessionId && s.isActive);
    if (session) {
      this.selectedSession.set(session);
      this.watchQuestions(session);
      this.shouldScrollToBottom.set(true);
    }
  }

  async submitQuestion() {
    const content = this.questionText().trim();
    if (!content) return;
    this.questionError.set('');

    const s = this.selectedSession();
    if (!s) return;

    const user = await this.auth.ensureAuthenticated();
    if (!user) return;

    const newQuestion: LiveQuestion = {
      uid: user.uid,
      contenu: content,
      time: Date.now().toString(),
      createdAt: new Date(),
      displayName: user.displayName,
      email: user.email,
      status: 'pending',
      reactions: [],
    };

    try {
      await this.fs.addQuestion(s.id, newQuestion);
      this.questionText.set('');
      this.showEmojiPanel.set(false);
      this.shouldScrollToBottom.set(true);
    } catch (error) {
      this.questionError.set(
        error instanceof Error && error.message.includes('limit')
          ? 'Vous avez atteint la limite de questions pour cet événement.'
          : "La question n'a pas pu être envoyée. Veuillez réessayer.",
      );
    }
  }

  scrollToBottom(): void {
    setTimeout(() => {
      if (this.scrollAnchor) {
        this.scrollAnchor.nativeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'end',
        });
      }
    }, 100);
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

    this.fs.setEmojis(reaction);

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

  addReaction(question: LiveQuestion, emoji: string) {
    if (!question.reactions) {
      question.reactions = [];
    }

    const existingReaction = question.reactions.find((r) => r.emoji === emoji);

    if (existingReaction) {
      existingReaction.count++;
    } else {
      question.reactions.push({ emoji, count: 1 });
    }

    // Déclencher aussi une réaction flottante
    this.triggerFloatingReaction(emoji);
  }

  toggleEmojiPanel() {
    this.showEmojiPanel.set(!this.showEmojiPanel());
  }

  toggleReactEmojiPanel() {
    this.showReactEmojiPanel.set(!this.showReactEmojiPanel());
  }

  addEmojiToText(emoji: string) {
    this.questionText.set(this.questionText() + emoji);
  }

  formatTime(timestamp?: string): string {
    if (!timestamp) return "À l'instant";
    const date = new Date(parseInt(timestamp));
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) {
      return "À l'instant";
    }

    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `Il y a ${minutes} min`;
    }

    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }

    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  ngOnDestroy(): void {
    if (this.speakersSub) {
      this.speakersSub.unsubscribe();
    }
    this.questionsSub?.unsubscribe();
  }
}
