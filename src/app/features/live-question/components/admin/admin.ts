import { Component, inject } from '@angular/core';
import { Card } from './session-list/card/card';
import { SessionForm } from './session-form/session-form';
import { FirestoreService } from '../../../../core/firestore/firestore.service';
import { Subscription } from 'rxjs';
import { Timestamp } from '@angular/fire/firestore';
import { LiveSession } from '../../models/live-session.model';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [Card, SessionForm],
  template: `
    <div class="container p-6 max-w-7xl mx-auto">
      <div class="flex items-center justify-between mb-6 ">
        <h1 class="text-2xl font-bold">Gestion des Sessions</h1>
        <button
          (click)="openForm()"
          class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          Ajouter une session
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        @for (session of sessions; track $index) {
          <app-card
            [session]="session"
            (viewSession)="onViewSession($event)"
            (toggleStatus)="onToggleStatus($event)"
          >
          </app-card>
        }
      </div>
    </div>
    @if (showForm) {
      <app-session-form
        [sessionToEdit]="selectedSession"
        (closed)="onFormClosed()"
      ></app-session-form>
    }
  `,
  styles: [``],
})
export default class AdminComponent {
  showForm: boolean = false;
  selectedSession?: any;
  sessions!: LiveSession<Timestamp>[];
  private fs = inject(FirestoreService);
  speakersSub!: Subscription;

  ngOnInit(): void {
    this.speakersSub = this.fs.getSessions().subscribe((sessions: any) => {
      this.sessions = sessions;
    });
  }

  onViewSession(session: LiveSession<Timestamp>) {
    console.log('Voir session:', session);
  }

  onToggleStatus(sessionId: string) {
    const session = this.sessions.find((s) => s.id === sessionId);
    if (session) {
      session.isActive = !session.isActive;
    }
  }
  openForm() {
    this.selectedSession = undefined;
    this.showForm = true;
  }

  onFormClosed() {
    this.showForm = false;
    this.selectedSession = undefined;
  }
  ngOnDestroy(): void {
    //Called once, before the instance is destroyed.
    //Add 'implements OnDestroy' to the class.
    this.speakersSub.unsubscribe();
  }
}
