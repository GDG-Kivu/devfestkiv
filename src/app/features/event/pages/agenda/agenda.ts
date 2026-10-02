import { ChangeDetectionStrategy, Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { EventConfigService, FestivalDaySchedule } from '../../services/event-config.service';
import { FirestoreService } from '../../../../core/firestore/firestore.service';
import { AgendaItem } from '../../models/agenda-item.model';

export interface FormattedAgendaItem {
  id: string;
  dayId: string;
  startsAt: string;
  endsAt: string;
  time: string;
  title: string;
  description?: string;
  speaker: string;
  minutes: string;
  room: string;
  category: string;
  rawCategory: string;
}

@Component({
  selector: 'app-agenda',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './agenda.html',
  imports: [CommonModule],
  styles: [
    `
      .animate-fade-in {
        animation: fadeIn 0.5s ease-out forwards;
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(16px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `,
  ],
})
export default class AgendaComponent implements OnInit {
  eventConfig = inject(EventConfigService);
  private fs = inject(FirestoreService);

  selectedDayId = signal<string>('all');
  allAgendaItems = signal<FormattedAgendaItem[]>([]);
  festivalDays = signal<FestivalDaySchedule[]>([]);
  isLoading = signal<boolean>(true);

  filteredAgendaEvents = computed(() => {
    const filter = this.selectedDayId();
    const list = this.allAgendaItems();
    const filtered = filter === 'all'
      ? list
      : list.filter((item) => (item.dayId || 'day1') === filter);

    return [...filtered].sort((a, b) => {
      // Tri par journée si on affiche toutes les journées
      if (filter === 'all' && a.dayId !== b.dayId) {
        return (a.dayId || 'day1').localeCompare(b.dayId || 'day1');
      }
      // Tri chronologique strict selon l'heure de début
      const startDiff = this.timeToMinutes(a.startsAt) - this.timeToMinutes(b.startsAt);
      if (startDiff !== 0) return startDiff;
      // En cas d'égalité, tri par heure de fin
      return this.timeToMinutes(a.endsAt) - this.timeToMinutes(b.endsAt);
    });
  });

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    this.festivalDays.set(this.eventConfig.getFestivalDays());

    this.fs.getCurrentEditionId().subscribe((editionId) => {
      this.fs.getPublishedEventCollection<AgendaItem>(editionId, 'agenda').subscribe({
        next: (items) => {
          if (items && items.length > 0) {
            const formatted = items
              .map((it) => {
                const diffMin = this.calculateDurationMinutes(it.startsAt, it.endsAt);
                return {
                  id: it.id,
                  dayId: it.dayId || 'day1',
                  startsAt: it.startsAt || '09:00',
                  endsAt: it.endsAt || '09:30',
                  time: `${it.startsAt} - ${it.endsAt}`,
                  title: it.title,
                  description: it.description,
                  speaker: (it.speakerIds || []).join(', '),
                  minutes: String(diffMin),
                  room: it.room,
                  category: it.format.charAt(0).toUpperCase() + it.format.slice(1),
                  rawCategory: it.format,
                };
              })
              .sort((a, b) => {
                if (a.dayId !== b.dayId) {
                  return (a.dayId || 'day1').localeCompare(b.dayId || 'day1');
                }
                const startDiff = this.timeToMinutes(a.startsAt) - this.timeToMinutes(b.startsAt);
                if (startDiff !== 0) return startDiff;
                return this.timeToMinutes(a.endsAt) - this.timeToMinutes(b.endsAt);
              });
            this.allAgendaItems.set(formatted);
          } else {
            this.allAgendaItems.set([]);
          }
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Erreur chargement agenda:', err);
          this.allAgendaItems.set([]);
          this.isLoading.set(false);
        },
      });
    });
  }

  private timeToMinutes(timeStr?: string): number {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map((v) => parseInt(v, 10) || 0);
    return h * 60 + m;
  }

  private calculateDurationMinutes(startsAt: string, endsAt: string): number {
    if (!startsAt || !endsAt) return 30;
    const sMinutes = this.timeToMinutes(startsAt);
    const eMinutes = this.timeToMinutes(endsAt);
    const diff = eMinutes - sMinutes;
    return diff > 0 ? diff : 30;
  }

  getDayName(dayId: string): string {
    const found = this.festivalDays().find((d) => d.id === dayId);
    return found ? found.name : dayId;
  }

  getBadgeColor(category: string): string {
    const cat = (category || '').toLowerCase();
    switch (cat) {
      case 'conference':
      case 'conférence':
        return 'bg-blue-500 text-white'; // Bleu vif
      case 'keynote':
        return 'bg-green-500 text-white'; // Vert vif
      case 'talk':
        return 'bg-red-500 text-white'; // Rouge vif
      case 'discussion':
      case 'panel':
        return 'bg-purple-500 text-white'; // Violet vif
      case 'break':
      case 'pause':
        return 'bg-slate-400 text-white'; // Gris équilibré
      case 'sponsor':
        return 'bg-emerald-500 text-white'; // Vert émeraude
      case 'closing':
      case 'clôture':
        return 'bg-orange-500 text-white'; // Orange vif
      case 'workshop':
      case 'atelier':
        return 'bg-amber-500 text-white'; // Ambre
      case 'codelab':
        return 'bg-sky-500 text-white'; // Bleu ciel
      default:
        return 'bg-blue-500 text-white';
    }
  }
}
