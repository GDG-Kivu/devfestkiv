import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventConfigService } from '../../services/event-config.service';

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

  ngOnInit(): void {
    // Scroll to top when component initializes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Agenda data is coming soon - keeping minimal structure for future use
  // eventsData and related methods are commented out until agenda is ready

  /*
  currentDayIndex = 0;
  activeTab = signal<'web' | 'mobile'>('web');*/

  days = this.eventConfig.agenda.days;

  // Données avec colonnes Web/Mobile
  eventsData = {
    agendaEvents: <
      Array<{
        time: string;
        title: string;
        speaker?: string;
        minutes?: string;
        room?: string;
        category: string;
      }>
    >[
      {
        time: '11:00 - 11:30',
        title: 'Check-in',
        speaker: '',
        minutes: '30',
        room: '',
        category: 'Conference',
      },
      {
        time: '11:30 - 12:00',
        title: 'Ice break + Keynote',
        speaker: '',
        minutes: '30',
        room: '',
        category: 'Keynote',
      },
      {
        time: '12:00 - 12:30',
        title: 'IA vs Local Guides : Comment votre contribution réécrit le futur de Google Maps',
        speaker: 'Yannick S. / Nick King',
        minutes: '30',
        room: '',
        category: 'Talk',
      },
      {
        time: '12:30 - 13:00',
        title: "Comment digitaliser les commerces locaux grâce à l'IA ?",
        speaker: 'Fearless Alain',
        minutes: ' 30',
        room: '',
        category: 'Talk',
      },
      {
        time: '13:00 - 13:45',
        title: 'Panel : Les réalités du métier de développeur en RDC',
        speaker:
          'Marie-Grâce Bahati, Heshima Magalabaha Ezra, Christian Rusipa Jerry, Raphael Amisi',
        minutes: '45',
        room: '',
        category: 'Discussion',
      },
      {
        time: '13:50 - 14:30',
        title: 'Networking',
        speaker: '',
        minutes: ' 40',
        room: '',
        category: 'Break',
      },
      {
        time: '14:45 - 15:15',
        title: "Au-delà du Prompt : Les Enjeux Éthiques et Sociaux de la Création d'Images par IA",
        speaker: 'Daniella Ansima',
        minutes: '30',
        room: '',
        category: 'Talk',
      },
      {
        time: '15:15 - 15:45',
        title: 'Sponsor time',
        speaker: '',
        minutes: '30',
        room: '',
        category: 'Sponsor',
      },
      {
        time: '15:45 - 16:15',
        title: "Tirer le meilleur de l'IA en tant que développeur",
        speaker: 'Amani Bisimwa',
        minutes: '30',
        room: '',
        category: 'Talk',
      },
      {
        time: '16:15 - 16:45',
        title: "Construire de vraies compétences en dev : l'IA n'est pas un raccourci",
        speaker: 'Jérémie Ndeke',
        minutes: '30',
        room: '',
        category: 'Talk',
      },
      {
        time: '17:00 - 17:30',
        title: 'Ask Me Anything session',
        speaker: 'Amani, Aksanti, Louis, Alain',
        minutes: '40',
        room: '',
        category: 'Discussion',
      },
      {
        time: '17:30 - 17:50',
        title: 'Closing and feedback',
        speaker: '',
        minutes: '20',
        room: '',
        category: 'Closing',
      },
    ],

    /*
    day1: {
      Web: [
        // Event data will be added here when agenda is ready
      ],
      Mobile: [
        // Event data will be added here when agenda is ready
      ],
    },*/
  };
  /*
  get currentDay() {
    return this.days[this.currentDayIndex];
  }

  selectDay(index: number) {
    this.currentDayIndex = 0;
    this.days[0].isActive = true;
  }*/

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

  /*
  getWebEvents(): Event[] {
    if (this.currentDay.id === 'day1') {
      const day1Data = this.eventsData['day1'] as Record<string, Event[]>;
      return day1Data['Web'] || [];
    }
    return [];
  }

  getMobileEvents(): Event[] {
    if (this.currentDay.id === 'day1') {
      const day1Data = this.eventsData['day1'] as Record<string, Event[]>;
      return day1Data['Mobile'] || [];
    }
    return [];
  }*/
}
