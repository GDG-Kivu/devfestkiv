import { Component, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirestoreService } from '../../../../../../../core/firestore/firestore.service';
import { Speaker } from '../../../../../../event/models/speaker.model';

@Component({
  selector: 'app-speakers-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: "speakers-modal.component.html"
})
export class SpeakersModalComponent implements OnInit {
  @Input({ required: true }) editionId!: string;
  @Output() close = new EventEmitter<void>();
  @Output() updated = new EventEmitter<void>();

  private fs = inject(FirestoreService);

  speakers = signal<Speaker[]>([]);
  availableDays = signal<Array<{ id: string; name: string; date?: string }>>([
    { id: 'day1', name: 'Jour 1' },
    { id: 'day2', name: 'Jour 2' },
  ]);
  isLoading = signal(true);
  showForm = signal(false);
  isEditing = signal(false);
  isSaving = signal(false);
  feedbackMessage = signal<string | null>(null);
  feedbackType = signal<'success' | 'error'>('success');

  activeSpeaker: Speaker = {
    name: '',
    title: '',
    bio: '',
    photo: '',
    socials: {},
    day: 'jour1',
    status: 'published',
  };

  ngOnInit(): void {
    this.loadEventDays();
    this.loadSpeakers();
  }

  private loadEventDays(): void {
    this.fs.getEvent(this.editionId).subscribe({
      next: (event) => {
        if (event?.agenda?.days && event.agenda.days.length > 0) {
          this.availableDays.set(
            event.agenda.days.map((d) => ({
              id: d.id,
              name: d.name,
              date: d.date,
            })),
          );
        }
      },
    });
  }

  private loadSpeakers(): void {
    this.isLoading.set(true);
    this.fs.getEventCollection<Speaker>(this.editionId, 'speakers').subscribe({
      next: (list) => {
        this.speakers.set(list || []);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  openCreateForm(): void {
    this.activeSpeaker = {
      name: '',
      title: '',
      bio: '',
      photo: '',
      socials: { twitter: '', linkedin: '', github: '' },
      day: 'jour1',
      status: 'published',
    };
    this.isEditing.set(false);
    this.feedbackMessage.set(null);
    this.showForm.set(true);
  }

  openEditForm(speaker: Speaker): void {
    this.activeSpeaker = {
      ...speaker,
      socials: speaker.socials || {},
    };
    this.isEditing.set(true);
    this.feedbackMessage.set(null);
    this.showForm.set(true);
  }

  handleImageError(event: Event): void {
    (event.target as HTMLImageElement).src = 'assets/logo.png';
  }

  async saveSpeaker(): Promise<void> {
    if (this.isSaving()) return;

    if (!this.activeSpeaker.name?.trim()) {
      this.feedbackType.set('error');
      this.feedbackMessage.set('Veuillez renseigner le nom complet du speaker.');
      return;
    }

    this.isSaving.set(true);
    this.feedbackMessage.set(null);

    try {
      if (this.isEditing() && this.activeSpeaker.id) {
        await this.fs.saveEventDocument(this.editionId, 'speakers', this.activeSpeaker as Speaker & { id: string });
      } else {
        const id = await this.fs.createEventDocument(this.editionId, 'speakers', this.activeSpeaker);
        this.activeSpeaker.id = id;
      }

      this.feedbackType.set('success');
      this.feedbackMessage.set('Speaker enregistré avec succès !');
      this.updated.emit();

      setTimeout(() => {
        this.showForm.set(false);
      }, 1000);
    } catch (err: any) {
      this.feedbackType.set('error');
      this.feedbackMessage.set(err?.message || 'Erreur lors de l\'enregistrement.');
    } finally {
      this.isSaving.set(false);
    }
  }

  async deleteSpeaker(speaker: Speaker): Promise<void> {
    if (!speaker.id) return;
    if (!confirm(`Supprimer l'intervenant ${speaker.name} ?`)) return;

    try {
      await this.fs.deleteEventDocument(this.editionId, 'speakers', speaker.id);
      this.updated.emit();
    } catch (err: any) {
      alert(err?.message || 'Erreur lors de la suppression.');
    }
  }
}
