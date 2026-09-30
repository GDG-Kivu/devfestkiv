import {
  Component,
  Input,
  Output,
  EventEmitter,
  inject,
  signal,
} from '@angular/core';

import { FormsModule, NgForm } from '@angular/forms';
import { FirestoreService } from '../../../../../../core/firestore/firestore.service';
import { FieldValue } from '@angular/fire/firestore';
import { LiveSession } from '../../../../models/live-session.model';

@Component({
  selector: 'app-session-form',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-lg w-200 p-6 relative">
        <h2 class="text-xl font-bold mb-4">
          {{ editingSession ? 'Modifier Session' : 'Ajouter Session' }}
        </h2>

        <form
          #sessionForm="ngForm"
          (ngSubmit)="submitForm(sessionForm)"
          class="space-y-4 max-h-100 overflow-y-auto"
        >
          <input type="hidden" [(ngModel)]="session.id" name="id" />

          <div>
            <label class="block text-sm font-medium mb-1">Thème</label>
            <input
              type="text"
              [(ngModel)]="session.theme"
              name="title"
              required
              class="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">Nom du Speaker</label>
            <input
              type="text"
              [(ngModel)]="session.speaker"
              name="speaker"
              required
              placeholder="Jeremie"
              class="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">Titre du Speaker</label>
            <input
              type="text"
              [(ngModel)]="session.title"
              name="theme"
              placeholder="web dev"
              required
              class="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">Heure</label>
            <input
              type="text"
              [(ngModel)]="session.time"
              name="time"
              placeholder="09:00 - 09:45"
              class="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">Track</label>
            <input
              type="text"
              [(ngModel)]="session.track"
              name="track"
              placeholder="Web, AI, "
              class="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">Slides (Embed Google)</label>
            <input
              type="text"
              [(ngModel)]="session.slides"
              name="slides"
              placeholder="Coller le lien embed ici"
              class="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">Description</label>
            <textarea
              [(ngModel)]="session.description"
              name="description"
              class="w-full border rounded px-3 py-2"
            ></textarea>
          </div>

          <div class="flex items-center gap-2">
            <input type="checkbox" [(ngModel)]="session.isActive" name="isActive" id="isActive" />
            <label for="isActive" class="text-sm font-medium">Active</label>
          </div>

          @if (errorMessage()) {
            <div class="text-xs p-3 rounded-xl bg-red-50 text-red-700 border border-red-200">
              {{ errorMessage() }}
            </div>
          }
        </form>

        <div class="flex justify-end gap-2 mt-4">
          <button (click)="closeForm()" class="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition cursor-pointer">
            Annuler
          </button>
          <button
            class="px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition cursor-pointer shadow-xs"
            (click)="submitForm(sessionForm)"
          >
            {{ editingSession ? 'Mettre à jour' : 'Enregistrer' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [``],
})
export class SessionForm<T> {
  @Input() sessionToEdit?: LiveSession<T>;
  @Output() closed = new EventEmitter<boolean>();

  session: LiveSession<T> = this.getEmptySession();
  editingSession: boolean = false;
  errorMessage = signal<string | null>(null);
  private fs = inject(FirestoreService);

  ngOnInit(): void {
    if (this.sessionToEdit) {
      this.session = this.sessionToEdit;
    }
  }

  private getEmptySession(): LiveSession<T> {
    const now = new Date() as any;

    return {
      id: '',
      title: '',
      speaker: '',
      theme: '',
      time: '',
      track: '',
      slides: '',
      questions: [],
      description: '',
      isActive: true,
      createAt: now,
      updateAt: now,
    };
  }

  submitForm(form: NgForm) {
    if (!this.session.speaker?.trim()) {
      this.errorMessage.set('Veuillez renseigner le nom de l\'intervenant / speaker.');
      return;
    }
    if (!this.session.title?.trim()) {
      this.errorMessage.set('Veuillez renseigner le titre de la session.');
      return;
    }

    this.errorMessage.set(null);
    this.session.id = this.session.id != '' ? this.session.id : this.fs.createDocId(`sessions`);
    this.session.createAt =
      this.session.createAt != '' ? this.session.createAt : (new Date() as any);
    this.session.updateAt = new Date() as any;
    this.fs.setSession(this.session as LiveSession<FieldValue>);

    this.closeForm();
  }

  closeForm() {
    console.log('click');
    this.closed.emit(true);
  }

  private resetForm() {
    this.session = this.getEmptySession();
    this.editingSession = false;
  }
}
