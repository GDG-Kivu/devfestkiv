import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SessionForm } from '../session-form/session-form';
import Questions from '../../../../components/questions/questions';
import { FirestoreService } from '../../../../../../core/firestore/firestore.service';
import { Timestamp } from '@angular/fire/firestore';
import { LiveSession } from '../../../../models/live-session.model';

@Component({
  selector: 'app-card',
  imports: [CommonModule, FormsModule, SessionForm, Questions],
  template: `
    <article class="flex flex-wrap items-center justify-between gap-5 p-5 sm:p-6">
      <div class="min-w-0 flex-1">
        <p class="text-xs font-bold text-[#174ea6] uppercase">{{ session.track }} · {{ session.time }}</p>
        <h3 class="mt-2 text-xl font-bold text-gray-900">{{ session.theme }}</h3>
        <p class="mt-1 text-sm text-gray-600">{{ session.speaker }} · {{ session.title }}</p>
        <p class="mt-2 text-sm text-gray-600">{{ session.description }}</p>
        <p class="mt-2 text-xs text-gray-500">{{ session.questions.length || 0 }} question(s)</p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <button type="button" (click)="statusChange(session)" [attr.aria-pressed]="session.isActive"
          class="border border-gray-300 px-3 py-2 text-xs font-bold">
          {{ session.isActive ? 'En cours' : 'Terminée' }}
        </button>
        <button type="button" (click)="vieuwDialog(session)" class="bg-[#174ea6] text-white px-3 py-2 text-xs font-bold">Voir</button>
        <button type="button" (click)="editSession(session)" class="bg-[#e8c270] px-3 py-2 text-xs font-bold">Modifier</button>
        <button type="button" (click)="promptDelete(session)" class="text-red-700 px-3 py-2 text-xs font-bold">Supprimer</button>
      </div>
    </article>

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
