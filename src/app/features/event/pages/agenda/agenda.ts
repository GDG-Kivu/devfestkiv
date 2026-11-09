import { ChangeDetectionStrategy, Component, OnInit, afterNextRender, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { EventConfigService, FestivalDaySchedule } from '../../services/event-config.service';
import { FirestoreService } from '../../../../core/firestore/firestore.service';
import { AgendaItem } from '../../models/agenda-item.model';
import { EVENT_CONFIG } from '../../../../config/event.config';

const FAVORITES_STORAGE_KEY = 'devfest_favorite_sessions';

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
  festivalDays = computed<FestivalDaySchedule[]>(() => {
    // 1. Lire depuis eventConfig (réactif au signal interne de configuration)
    let days = this.eventConfig.getFestivalDays();
    if (days && days.length > 1) {
      return days;
    }

    // 2. Détecter dynamiquement les journées distinctes présentes dans les sessions chargées
    const items = this.allAgendaItems();
    const itemDayIds = Array.from(new Set(items.map((it) => it.dayId).filter(Boolean)));
    if (itemDayIds.length > 1) {
      itemDayIds.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
      return itemDayIds.map((id, index) => {
        const found = days.find((d) => d.id === id);
        if (found) return found;
        const num = index + 1;
        const now = new Date();
        return {
          id,
          dayNumber: num,
          name: `Jour ${num}`,
          date: `J${num}`,
          fullDate: `Jour ${num}`,
          location: '',
          isActive: true,
          startTime: now,
          endTime: now,
          startMs: now.getTime(),
          endMs: now.getTime(),
          startsAt: '09:00',
          endsAt: '18:00',
        };
      });
    }

    // 3. Fallback sur EVENT_CONFIG pour garantir la présence des jours du festival
    const fallbackDays = this.eventConfig.getFestivalDays(EVENT_CONFIG);
    if (fallbackDays && fallbackDays.length > 1) {
      return fallbackDays;
    }

    return days;
  });
  isLoading = signal<boolean>(true);

  // Filtre par format
  readonly formatChips = [
    { value: 'all', label: 'Tous les formats' },
    { value: 'favorites', label: '⭐ Mes favoris' },
    { value: 'keynote', label: 'Keynote' },
    { value: 'talk', label: 'Talk' },
    { value: 'workshop', label: 'Workshop' },
    { value: 'codelab', label: 'Codelab' },
    { value: 'break', label: 'Break' },
    { value: 'conference', label: 'Conférence' },
    { value: 'discussion', label: 'Discussion' },
    { value: 'sponsor', label: 'Sponsor' },
    { value: 'closing', label: 'Clôture' },
  ];
  selectedFormat = signal<string>('all');

  onFormatChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    if (target) {
      this.selectedFormat.set(target.value);
    }
  }
 
  // Favoris (persistés dans localStorage)
  showFavoritesOnly = signal<boolean>(false);
  favoriteIds = signal<Set<string>>(new Set());

  filteredAgendaEvents = computed(() => {
    const day = this.selectedDayId();
    const format = this.selectedFormat();
    const favoritesOnly = this.showFavoritesOnly() || format === 'favorites';
    const favorites = this.favoriteIds();
    const list = this.allAgendaItems();

    const filtered = list.filter((item) => {
      if (day !== 'all' && (item.dayId || 'day1') !== day) return false;
      if (format === 'favorites') {
        return favorites.has(item.id);
      }
      if (format !== 'all' && (item.rawCategory || '').toLowerCase() !== format) return false;
      if (favoritesOnly && !favorites.has(item.id)) return false;
      return true;
    });


    return [...filtered].sort((a, b) => {
      // Tri par journée si on affiche toutes les journées
      if (day === 'all' && a.dayId !== b.dayId) {
        return (a.dayId || 'day1').localeCompare(b.dayId || 'day1');
      }
      // Tri chronologique strict selon l'heure de début
      const startDiff = this.timeToMinutes(a.startsAt) - this.timeToMinutes(b.startsAt);
      if (startDiff !== 0) return startDiff;
      // En cas d'égalité, tri par heure de fin
      return this.timeToMinutes(a.endsAt) - this.timeToMinutes(b.endsAt);
    });
  });

 
  constructor() {
    // Exécuté uniquement dans le navigateur (localStorage n'existe pas côté serveur),
    // et après le premier rendu pour ne pas créer de décalage avec l'hydratation SSR.
    afterNextRender(() => {
      this.favoriteIds.set(this.readFavorites());
    });
  }

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

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
  // ---------- Favoris ----------
 
  isFavorite(id: string): boolean {
    return this.favoriteIds().has(id);
  }
 
  toggleFavorite(id: string): void {
    const next = new Set(this.favoriteIds());
    if (!next.delete(id)) {
      next.add(id);
    }
    this.favoriteIds.set(next);
    this.saveFavorites(next);
  }
 
  private readFavorites(): Set<string> {
    try {
      const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(parsed)) return new Set();
      return new Set(parsed.filter((v): v is string => typeof v === 'string'));
    } catch {
      return new Set();
    }
  }
 
  private saveFavorites(ids: Set<string>): void {
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify([...ids]));
    } catch {
      // Stockage indisponible (mode privé, quota atteint) : on ignore, les favoris restent en mémoire.
    }
  }
 
  // ---------- Filtres ----------
 
  resetFilters(): void {
    this.selectedDayId.set('all');
    this.selectedFormat.set('all');
    this.showFavoritesOnly.set(false);
  }
 
  formatChipClass(value: string): string {
    if (this.selectedFormat() !== value) {
      return 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100';
    }
    const active = value === 'all' ? 'bg-gray-900 text-white' : this.getBadgeColor(value);
    return `${active} border border-transparent`;
  }
 
  // ---------- Utilitaires ----------

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
        return 'bg-[#00458f] text-white'; // DevFest Bleu
      case 'keynote':
        return 'bg-[#34A853] text-white'; // Google Vert
      case 'talk':
        return 'bg-[#fbbc04] text-[#1a1200] font-bold'; // DevFest Jaune
      case 'discussion':
      case 'panel':
        return 'bg-purple-600 text-white';
      case 'break':
      case 'pause':
        return 'bg-slate-400 text-white';
      case 'sponsor':
        return 'bg-emerald-600 text-white';
      case 'closing':
      case 'clôture':
        return 'bg-[#00458f] text-white';
      case 'workshop':
      case 'atelier':
        return 'bg-[#EA4335] text-white'; // Google Rouge
      case 'codelab':
        return 'bg-sky-600 text-white';
      default:
        return 'bg-[#00458f] text-white';
    }
  }
}
