import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventConfigService, FestivalDaySchedule } from '../../services/event-config.service';
import { FirestoreService } from '../../../../core/firestore/firestore.service';
import { AgendaItem } from '../../models/agenda-item.model';

export interface FormattedAgendaItem {
  id?: string;
  dayId: string;
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
  templateUrl: './agenda.html',
  standalone: true,
  imports: [CommonModule],
  styles: [
    `
      .animate-fade-in {
        animation: fadeIn 0.8s ease-out forwards;
        opacity: 0;
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(20px);
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

  initialFallbackAgenda: FormattedAgendaItem[] = [
    {
      dayId: 'day1',
      time: '11:00 - 11:30',
      title: 'Check-in',
      speaker: '',
      minutes: '30',
      room: 'Hall Principal',
      category: 'Conference',
      rawCategory: 'talk',
    },
    {
      dayId: 'day1',
      time: '11:30 - 12:00',
      title: 'Ice break + Keynote',
      speaker: '',
      minutes: '30',
      room: 'Grand Amphi',
      category: 'Keynote',
      rawCategory: 'keynote',
    },
    {
      dayId: 'day1',
      time: '12:00 - 12:30',
      title: 'IA vs Local Guides : Comment votre contribution réécrit le futur de Google Maps',
      speaker: 'Yannick S. / Nick King',
      minutes: '30',
      room: 'Grand Amphi',
      category: 'Talk',
      rawCategory: 'talk',
    },
    {
      dayId: 'day1',
      time: '12:30 - 13:00',
      title: "Comment digitaliser les commerces locaux grâce à l'IA ?",
      speaker: 'Fearless Alain',
      minutes: '30',
      room: 'Salle B',
      category: 'Talk',
      rawCategory: 'talk',
    },
    {
      dayId: 'day1',
      time: '13:00 - 13:45',
      title: 'Panel : Les réalités du métier de développeur en RDC',
      speaker: 'Marie-Grâce Bahati, Heshima Magalabaha Ezra, Christian Rusipa Jerry, Raphael Amisi',
      minutes: '45',
      room: 'Grand Amphi',
      category: 'Discussion',
      rawCategory: 'discussion',
    },
    {
      dayId: 'day1',
      time: '13:50 - 14:30',
      title: 'Networking & Pause Déjeuner',
      speaker: '',
      minutes: '40',
      room: 'Espace Networking',
      category: 'Break',
      rawCategory: 'break',
    },
    {
      dayId: 'day1',
      time: '14:45 - 15:15',
      title: "Au-delà du Prompt : Les Enjeux Éthiques et Sociaux de la Création d'Images par IA",
      speaker: 'Daniella Ansima',
      minutes: '30',
      room: 'Grand Amphi',
      category: 'Talk',
      rawCategory: 'talk',
    },
    {
      dayId: 'day1',
      time: '15:15 - 15:45',
      title: 'Sponsor time & Démos',
      speaker: '',
      minutes: '30',
      room: 'Grand Amphi',
      category: 'Sponsor',
      rawCategory: 'talk',
    },
    {
      dayId: 'day1',
      time: '15:45 - 16:15',
      title: "Tirer le meilleur de l'IA en tant que développeur",
      speaker: 'Amani Bisimwa',
      minutes: '30',
      room: 'Salle Tech',
      category: 'Talk',
      rawCategory: 'talk',
    },
    {
      dayId: 'day1',
      time: '16:15 - 16:45',
      title: "Construire de vraies compétences en dev : l'IA n'est pas un raccourci",
      speaker: 'Jérémie Ndeke',
      minutes: '30',
      room: 'Grand Amphi',
      category: 'Talk',
      rawCategory: 'talk',
    },
    {
      dayId: 'day1',
      time: '17:00 - 17:30',
      title: 'Ask Me Anything session',
      speaker: 'Amani, Aksanti, Louis, Alain',
      minutes: '30',
      room: 'Grand Amphi',
      category: 'Discussion',
      rawCategory: 'discussion',
    },
    {
      dayId: 'day1',
      time: '17:30 - 17:50',
      title: 'Closing and feedback',
      speaker: '',
      minutes: '20',
      room: 'Grand Amphi',
      category: 'Closing',
      rawCategory: 'keynote',
    },
  ];

  filteredAgendaEvents = computed(() => {
    const filter = this.selectedDayId();
    const list = this.allAgendaItems();
    if (filter === 'all') {
      return list;
    }
    return list.filter((item) => (item.dayId || 'day1') === filter);
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
            const formatted = items.map((it) => {
              const diffMin = this.calculateDurationMinutes(it.startsAt, it.endsAt);
              return {
                id: it.id,
                dayId: it.dayId || 'day1',
                time: `${it.startsAt} - ${it.endsAt}`,
                title: it.title,
                description: it.description,
                speaker: (it.speakerIds || []).join(', '),
                minutes: String(diffMin),
                room: it.room,
                category: it.format.charAt(0).toUpperCase() + it.format.slice(1),
                rawCategory: it.format,
              };
            });
            this.allAgendaItems.set(formatted);
          } else {
            this.allAgendaItems.set([...this.initialFallbackAgenda]);
          }
        },
        error: () => {
          this.allAgendaItems.set([...this.initialFallbackAgenda]);
        },
      });
    });
  }

  private calculateDurationMinutes(startsAt: string, endsAt: string): number {
    if (!startsAt || !endsAt) return 30;
    const [sh, sm] = startsAt.split(':').map((v) => parseInt(v, 10) || 0);
    const [eh, em] = endsAt.split(':').map((v) => parseInt(v, 10) || 0);
    const diff = (eh * 60 + em) - (sh * 60 + sm);
    return diff > 0 ? diff : 30;
  }

  getDayName(dayId: string): string {
    const found = this.festivalDays().find((d) => d.id === dayId);
    return found ? found.name : dayId;
  }

  getBadgeColor(category: string): string {
    const colors: { [key: string]: string } = {
      Break: 'bg-gray-500 text-white border border-gray-600',
      Conference: 'bg-blue-500 text-white border border-blue-600',
      Keynote: 'bg-green-500 text-white border border-green-600',
      Workshop: 'bg-yellow-500 text-white border border-yellow-600',
      Talk: 'bg-red-500 text-white border border-red-600',
      Discussion: 'bg-purple-500 text-white border border-purple-600',
      Closing: 'bg-orange-500 text-white border border-orange-600',
      Sponsor: 'bg-green-500 text-white border border-green-600',
    };
    return colors[category] || 'bg-gray-500 text-white border border-gray-600';
  }
}

