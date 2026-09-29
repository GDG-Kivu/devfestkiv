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
      <!-- Background image -->
      <div
        class="absolute inset-0 bg-cover bg-center opacity-100 transition-all duration-300 group-hover:opacity-100"
        [ngStyle]="{
          'background-image': 'url(' + 'assets/back.png' + ')',
        }"
      ></div>

      <!-- Semi-transparent overlay -->
      <div class="absolute inset-0 bg-white/70 backdrop-blur-[1px]"></div>

      <!-- Main card content -->
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

          <!-- Theme -->
          <h3 class="text-2xl font-extrabold leading-snug mb-2 text-gray-900 tracking-tight">
            {{ session.theme }}
          </h3>

          <!-- Speaker info -->
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

        <!-- Session active status toggle -->
        <div class="flex items-center justify-between border-t border-gray-200 pt-3 pb-2">
          <span class="text-sm font-medium text-gray-700">Statut de la session</span>
          <div class="flex items-center gap-2 cursor-pointer" (click)="statusChange(session)">
            <!-- Switch toggle -->
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
              {{ session.isActive ? 'En cours' : 'Terminée' }}
            </span>
          </div>
        </div>

        <!-- Footer actions -->
        <div
          class="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 pt-3"
        >
          <!-- Questions count -->
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

          <!-- Action buttons -->
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
              (click)="promptDelete(session)"
              class="px-3 py-1.5 text-xs font-semibold bg-red-500 hover:bg-red-600 text-white rounded-lg transition cursor-pointer"
            >
              Supprimer
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Session Form Modal -->
    @if (showForm) {
      <app-session-form
        [sessionToEdit]="selectedSession"
        (closed)="onFormClosed()"
      ></app-session-form>
    }

    <!-- Live Questions Modal -->
    @if (dialogOuvert) {
      <app-questions
        [sessionId]="sessionSelectionnee.id"
        [sessionTitle]="sessionSelectionnee.title"
        [initialQuestions]="sessionSelectionnee.questions ? sessionSelectionnee.questions : []"
        (close)="dialogOuvert = false"
      ></app-questions>
    }

    <!-- Confirmation Dialog for Session Deletion -->
    @if (showDeleteModal) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
        <div class="relative bg-white rounded-3xl w-full max-w-md min-w-[300px] sm:min-w-[420px] p-6 sm:p-8 shadow-2xl border border-gray-100 animate-pop-in space-y-5 my-auto">
          <div class="flex items-center gap-3.5">
            <div class="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </div>
            <div>
              <h3 class="text-lg font-bold text-gray-900">Supprimer cette session ?</h3>
              <p class="text-xs text-gray-500">Confirmation de suppression définitive</p>
            </div>
          </div>

          <div class="text-sm text-gray-600 bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-1">
            <p>Êtes-vous sûr de vouloir supprimer la session :</p>
            <p class="font-bold text-gray-900">{{ sessionToDelete?.theme }}</p>
            <p class="text-xs text-red-600 mt-2 font-medium">⚠️ Cette action est irréversible et supprimera la session.</p>
          </div>

          <div class="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              (click)="cancelDelete()"
              class="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="button"
              (click)="confirmDelete()"
              class="px-5 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-md transition cursor-pointer"
            >
              Supprimer définitivement
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes popIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
    .animate-fade-in {
      animation: fadeIn 0.2s ease-out forwards;
    }
    .animate-pop-in {
      animation: popIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
  `,
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

  // Delete confirmation modal state
  showDeleteModal = false;
  sessionToDelete?: LiveSession<Timestamp>;

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

  promptDelete(session: LiveSession<Timestamp>) {
    this.sessionToDelete = session;
    this.showDeleteModal = true;
  }

  confirmDelete() {
    if (this.sessionToDelete) {
      this.fs.deleteSession(this.sessionToDelete.id);
    }
    this.showDeleteModal = false;
    this.sessionToDelete = undefined;
  }

  cancelDelete() {
    this.showDeleteModal = false;
    this.sessionToDelete = undefined;
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

