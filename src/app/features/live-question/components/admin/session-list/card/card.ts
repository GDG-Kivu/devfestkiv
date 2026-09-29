import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SessionForm } from '../../session-form/session-form';
import Questions from '../../../questions/questions';
import { FirestoreService } from '../../../../../../core/firestore/firestore.service';
import { Timestamp } from '@angular/fire/firestore';
import { LiveSession } from '../../../../models/live-session.model';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule, FormsModule, SessionForm, Questions],
  template: `
    <div
      class="relative cursor-pointer rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-2xl group"
      [ngClass]="getBorderColor('Dev Track')"
    >
      <!-- Image de fond -->
      <div
        class="absolute inset-0 bg-cover bg-center opacity-100 transition-all duration-300 group-hover:opacity-100"
        [ngStyle]="{
          'background-image': 'url(' + 'assets/back.png' + ')',
        }"
      ></div>

      <!-- Couche blanche translucide pour lisibilité -->
      <div class="absolute inset-0 bg-white/70 backdrop-blur-[1px]"></div>

      <!-- Contenu principal -->
      <div class="relative z-10 p-6 flex flex-col justify-between min-h-[300px] text-gray-800">
        <!-- Header -->
        <div>
          <div class="flex items-start justify-between mb-3">
            <span
              class="text-xs font-bold px-2 py-1 rounded-full bg-gray-100 border border-gray-300"
              [ngClass]="getBadgeColor(session.track)"
            >
              {{ session.track }}
            </span>
            <span class="text-xs text-gray-600 font-mono">{{ session.time }}</span>
          </div>

          <!-- Thème (agrandi) -->
          <h3 class="text-2xl font-extrabold leading-snug mb-2 text-gray-900 tracking-tight">
            {{ session.theme }}
          </h3>

          <!-- Speaker -->
          <div class="text-sm text-gray-700 mb-3">
            <div class="flex items-center gap-2">
              <span class="material-icons text-[18px] text-gray-500">person</span>
              <span class="font-medium">{{ session.speaker }}</span>
            </div>
            <p class="text-xs italic text-gray-500">{{ session.title }}</p>
          </div>
        </div>

        <!-- Description -->
        <p class="text-sm text-gray-700 mb-4 line-clamp-3">
          {{ session.description }}
        </p>

        <!-- Statut de la session -->
        <div class="flex items-center justify-between border-t border-gray-200 pt-3 pb-2">
          <span class="text-sm font-medium text-gray-700">Statut de la session</span>
          <div class="flex items-center gap-2 cursor-pointer" (click)="statusChange(session)">
            <!-- Switch -->
            <div
              class="relative w-12 h-6 rounded-full transition-all duration-300"
              [ngClass]="session.isActive ? 'bg-green-500' : 'bg-gray-300'"
            >
              <div
                class="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transform transition-all duration-300"
                [ngClass]="session.isActive ? 'translate-x-6' : 'translate-x-0'"
              ></div>
            </div>
            <span
              class="text-xs font-semibold transition-colors duration-300"
              [ngClass]="session.isActive ? 'text-green-600' : 'text-gray-500'"
            >
              {{ session.isActive ? 'Encours' : 'Terminée' }}
            </span>
          </div>
        </div>

        <!-- Footer / Actions -->
        <div
          class="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 pt-3"
        >
          <!-- Questions -->
          <div class="flex items-center gap-2 text-sm text-gray-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="w-5 h-5"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
              />
            </svg>
            <span>{{ session.questions.length || 0 }} question(s)</span>
          </div>

          <!-- Boutons -->
          <div class="flex items-center gap-2">
            <button
              (click)="vieuwDialog(session)"
              class="px-3 py-1.5 text-xs font-semibold bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition cursor-pointer"
            >
              Voir
            </button>
            <button
              (click)="editSession(session)"
              class="px-3 py-1.5 text-xs font-semibold bg-yellow-400 hover:bg-yellow-500 text-black rounded-lg transition cursor-pointer"
            >
              Modifier
            </button>
            <button
              (click)="deleteSession(session)"
              class="px-3 py-1.5 text-xs font-semibold bg-red-500 hover:bg-red-600 text-white rounded-lg transition cursor-pointer"
            >
              Supprimer
            </button>
          </div>
        </div>
      </div>
    </div>

    @if (showForm) {
      <app-session-form
        [sessionToEdit]="selectedSession"
        (closed)="onFormClosed()"
      ></app-session-form>
    }
    @if (dialogOuvert) {
      <app-questions
        [sessionId]="sessionSelectionnee.id"
        [sessionTitle]="sessionSelectionnee.title"
        [initialQuestions]="sessionSelectionnee.questions ? sessionSelectionnee.questions : []"
        (close)="dialogOuvert = false"
      ></app-questions>
    }
  `,
  styles: [``],
})
export class Card {
  @Input() session!: LiveSession<Timestamp>;
  private fs = inject(FirestoreService);
  @Output() viewSession = new EventEmitter<LiveSession<Timestamp>>();
  @Output() toggleStatus = new EventEmitter<string>();
  showForm: boolean = false;
  selectedSession?: any;
  dialogOuvert = false;
  sessionSelectionnee: any;

  getBadgeColor(track: string) {
    const colors: Record<string, string> = {
      'Tech Track': 'bg-blue-100 text-blue-600',
      'Dev Track': 'bg-purple-100 text-purple-600',
      'Cloud Track': 'bg-indigo-100 text-indigo-600',
      'Security Track': 'bg-red-100 text-red-600',
      'Fintech Track': 'bg-yellow-100 text-yellow-600',
      'Design Track': 'bg-green-100 text-green-600',
    };
    return colors[track] || 'bg-gray-100 text-gray-600';
  }

  statusChange(session: LiveSession<Timestamp>) {
    session.isActive = !session.isActive;
    session.updateAt = new Date() as any;
    this.fs.setSession(session);
  }
  editSession(session: any) {
    this.showForm = true;
    this.selectedSession = session;
  }

  deleteSession(session: LiveSession<Timestamp>) {
    this.fs.deleteSession(session.id);
  }
  onFormClosed() {
    this.showForm = false;
    this.selectedSession = undefined;
  }

  getBorderColor(track: string) {
    const colors: Record<string, string> = {
      'Tech Track': 'border-blue-200',
      'Dev Track': 'border-purple-200',
      'Cloud Track': 'border-indigo-200',
      'Security Track': 'border-red-200',
      'Fintech Track': 'border-yellow-200',
      'Design Track': 'border-green-200',
    };
    return colors[track] || 'border-gray-200';
  }

  vieuwDialog(session: any) {
    this.sessionSelectionnee = session;
    this.dialogOuvert = true;
  }
}
