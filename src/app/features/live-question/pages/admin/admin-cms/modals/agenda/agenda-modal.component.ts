import { Component, EventEmitter, Input, OnInit, Output, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirestoreService } from '../../../../../../../core/firestore/firestore.service';
import { AgendaFormat, AgendaItem } from '../../../../../../event/models/agenda-item.model';
import { EventConfigService, FestivalDaySchedule } from '../../../../../../event/services/event-config.service';

@Component({
  selector: 'app-agenda-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: "agenda-modal.component.html"
})
export class AgendaModalComponent implements OnInit {
  @Input({ required: true }) editionId!: string;
  @Output() close = new EventEmitter<void>();
  @Output() updated = new EventEmitter<void>();

  private fs = inject(FirestoreService);
  private eventConfig = inject(EventConfigService);

  agendaItems = signal<AgendaItem[]>([]);
  availableDays = signal<Array<{ id: string; name: string; date?: string; fullDate?: string }>>([
    { id: 'day1', name: 'Jour 1', date: '29 Nov' },
  ]);
  selectedDayFilter = signal<string>('all');

  isLoading = signal(true);
  showForm = signal(false);
  isEditing = signal(false);
  isSaving = signal(false);
  isTimeRangeInvalid = signal(false);
  calculatedDurationText = signal('');
  feedbackMessage = signal<string | null>(null);
  feedbackType = signal<'success' | 'error'>('success');
  speakersInput = '';

  activeItem: AgendaItem = {
    id: '',
    editionId: '',
    dayId: 'day1',
    title: '',
    description: '',
    speakerIds: [],
    startsAt: '10:00',
    endsAt: '10:30',
    room: '',
    track: 'General',
    format: 'talk',
    isPublished: true,
  };

  filteredAgendaItems = computed(() => {
    const filter = this.selectedDayFilter();
    const items = this.agendaItems();
    const filtered = filter === 'all'
      ? items
      : items.filter((it) => (it.dayId || 'day1') === filter);

    return [...filtered].sort((a, b) => {
      if (filter === 'all' && a.dayId !== b.dayId) {
        return (a.dayId || 'day1').localeCompare(b.dayId || 'day1');
      }
      const [ah, am] = (a.startsAt || '00:00').split(':').map((v) => parseInt(v, 10) || 0);
      const [bh, bm] = (b.startsAt || '00:00').split(':').map((v) => parseInt(v, 10) || 0);
      const startDiff = (ah * 60 + am) - (bh * 60 + bm);
      if (startDiff !== 0) return startDiff;
      return (a.endsAt || '').localeCompare(b.endsAt || '');
    });
  });

  ngOnInit(): void {
    this.loadEventDays();
    this.loadAgenda();
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
              fullDate: d.fullDate,
            })),
          );
        } else {
          const days = this.eventConfig.getFestivalDays();
          this.availableDays.set(
            days.map((d) => ({
              id: d.id,
              name: d.name,
              date: d.date,
              fullDate: d.fullDate,
            })),
          );
        }
      },
    });
  }

  private loadAgenda(): void {
    this.isLoading.set(true);
    this.fs.getEventCollection<AgendaItem>(this.editionId, 'agenda').subscribe({
      next: (list) => {
        this.agendaItems.set(list || []);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  getDayLabel(dayId: string): string {
    const found = this.availableDays().find((d) => d.id === dayId);
    return found ? found.name : dayId;
  }

  onTimeChange(): void {
    const s = this.activeItem.startsAt;
    const e = this.activeItem.endsAt;

    if (!s || !e) {
      this.isTimeRangeInvalid.set(false);
      this.calculatedDurationText.set('');
      return;
    }

    const [sh, sm] = s.split(':').map((v) => parseInt(v, 10) || 0);
    const [eh, em] = e.split(':').map((v) => parseInt(v, 10) || 0);

    const sMinutes = sh * 60 + sm;
    const eMinutes = eh * 60 + em;

    if (eMinutes <= sMinutes) {
      this.isTimeRangeInvalid.set(true);
      this.calculatedDurationText.set('');
      return;
    }

    this.isTimeRangeInvalid.set(false);
    const diff = eMinutes - sMinutes;
    const hours = Math.floor(diff / 60);
    const mins = diff % 60;

    if (hours > 0 && mins > 0) {
      this.calculatedDurationText.set(`${hours}h ${mins}min (${diff} min)`);
    } else if (hours > 0) {
      this.calculatedDurationText.set(`${hours}h (${diff} min)`);
    } else {
      this.calculatedDurationText.set(`${mins} min`);
    }
  }

  openCreateForm(): void {
    const defaultDay = this.availableDays().length > 0 ? this.availableDays()[0].id : 'day1';
    const { startsAt, endsAt } = this.computeNextAvailableSlot(defaultDay);
    this.activeItem = {
      id: '',
      editionId: this.editionId,
      dayId: defaultDay,
      title: '',
      description: '',
      speakerIds: [],
      startsAt,
      endsAt,
      room: 'Grand Amphi',
      track: 'General',
      format: 'talk',
      isPublished: true,
    };
    this.speakersInput = '';
    this.isEditing.set(false);
    this.feedbackMessage.set(null);
    this.onTimeChange();
    this.showForm.set(true);
  }

  /**
   * Computes the next available start time for a given day,
   * based on the latest endsAt time of existing sessions.
   * Returns start + 45 min duration as a default.
   */
  private computeNextAvailableSlot(dayId: string): { startsAt: string; endsAt: string } {
    const dayItems = this.agendaItems().filter((it) => (it.dayId || 'day1') === dayId);
    const pad = (n: number) => String(n).padStart(2, '0');

    if (dayItems.length === 0) {
      return { startsAt: '09:00', endsAt: '09:45' };
    }

    // Find the latest end time
    let latestEndMinutes = 0;
    for (const item of dayItems) {
      if (item.endsAt) {
        const [h, m] = item.endsAt.split(':').map((v) => parseInt(v, 10) || 0);
        const totalMin = h * 60 + m;
        if (totalMin > latestEndMinutes) latestEndMinutes = totalMin;
      }
    }

    // Suggest start at latest end, clamp to 18:00 max
    const startMin = Math.min(latestEndMinutes, 17 * 60 + 15);
    const endMin = Math.min(startMin + 45, 18 * 60);

    return {
      startsAt: `${pad(Math.floor(startMin / 60))}:${pad(startMin % 60)}`,
      endsAt: `${pad(Math.floor(endMin / 60))}:${pad(endMin % 60)}`,
    };
  }

  onDayChange(dayId: string): void {
    if (!this.isEditing()) {
      const { startsAt, endsAt } = this.computeNextAvailableSlot(dayId);
      this.activeItem.startsAt = startsAt;
      this.activeItem.endsAt = endsAt;
      this.onTimeChange();
    }
  }

  openEditForm(item: AgendaItem): void {
    this.activeItem = { ...item };
    this.speakersInput = (item.speakerIds || []).join(', ');
    this.isEditing.set(true);
    this.feedbackMessage.set(null);
    this.onTimeChange();
    this.showForm.set(true);
  }

  getFormatBadgeClass(format: AgendaFormat | string): string {
    switch (format) {
      case 'conference':
        return 'bg-blue-500 text-white';
      case 'keynote':
        return 'bg-green-500 text-white';
      case 'talk':
        return 'bg-red-500 text-white';
      case 'discussion':
        return 'bg-purple-500 text-white';
      case 'break':
        return 'bg-slate-400 text-white';
      case 'sponsor':
        return 'bg-emerald-500 text-white';
      case 'closing':
        return 'bg-orange-500 text-white';
      case 'workshop':
        return 'bg-amber-500 text-white';
      case 'codelab':
        return 'bg-sky-500 text-white';
      default:
        return 'bg-blue-500 text-white';
    }
  }

  async saveItem(): Promise<void> {
    if (this.isSaving()) return;

    if (!this.activeItem.title?.trim()) {
      this.feedbackType.set('error');
      this.feedbackMessage.set('Veuillez renseigner le titre du créneau au programme.');
      return;
    }

    if (this.isTimeRangeInvalid()) {
      this.feedbackType.set('error');
      this.feedbackMessage.set('L\'heure de fin doit être postérieure à l\'heure de début.');
      return;
    }

    this.isSaving.set(true);
    this.feedbackMessage.set(null);

    try {
      this.activeItem.editionId = this.editionId;
      this.activeItem.speakerIds = this.speakersInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      if (this.isEditing() && this.activeItem.id) {
        await this.fs.saveEventDocument(this.editionId, 'agenda', this.activeItem);
      } else {
        const id = await this.fs.createEventDocument(this.editionId, 'agenda', this.activeItem);
        this.activeItem.id = id;
      }

      this.feedbackType.set('success');
      this.feedbackMessage.set('Créneau d\'agenda enregistré avec succès !');
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

  async deleteItem(item: AgendaItem): Promise<void> {
    if (!item.id) return;
    if (!confirm(`Supprimer le créneau "${item.title}" ?`)) return;

    try {
      await this.fs.deleteEventDocument(this.editionId, 'agenda', item.id);
      this.updated.emit();
    } catch (err: any) {
      alert(err?.message || 'Erreur lors de la suppression.');
    }
  }
}
