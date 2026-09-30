import { Component, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirestoreService } from '../../../../../../core/firestore/firestore.service';
import { EventAlbum, EventGalleryItem } from '../../../../../event/models/event.model';

@Component({
  selector: 'app-gallery-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div class="relative bg-white rounded-3xl w-full max-w-4xl min-w-[320px] p-6 sm:p-8 shadow-2xl border border-gray-100 animate-pop-in space-y-6 my-auto max-h-[90vh] overflow-y-auto">
        
        <!-- Header -->
        <div class="flex items-center justify-between pb-4 border-b border-gray-100">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center flex-shrink-0">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
            </div>
            <div>
              <h3 class="text-lg font-bold text-gray-900">Galerie Photos & Albums Publics</h3>
              <p class="text-xs text-gray-500">Édition : {{ editionId }} • {{ galleryImages().length }} photo(s) & {{ albums().length }} album(s)</p>
            </div>
          </div>
          <button
            type="button"
            (click)="close.emit()"
            class="text-gray-400 hover:text-gray-700 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition cursor-pointer text-base font-bold"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        <!-- Tab Selection: Photos vs Albums -->
        <div class="flex items-center gap-2 border-b border-gray-100 pb-3">
          <button
            type="button"
            (click)="activeTab.set('photos')"
            class="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer"
            [class.bg-pink-50]="activeTab() === 'photos'"
            [class.text-pink-600]="activeTab() === 'photos'"
            [class.text-gray-500]="activeTab() !== 'photos'"
          >
            🖼️ Photos de l'édition ({{ galleryImages().length }})
          </button>
          <button
            type="button"
            (click)="activeTab.set('albums')"
            class="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer"
            [class.bg-pink-50]="activeTab() === 'albums'"
            [class.text-pink-600]="activeTab() === 'albums'"
            [class.text-gray-500]="activeTab() !== 'albums'"
          >
            📁 Liens Albums Publics ({{ albums().length }})
          </button>
        </div>

        @if (isLoading()) {
          <div class="py-12 text-center text-gray-400 flex flex-col items-center gap-3">
            <svg class="w-8 h-8 animate-spin text-pink-600" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span class="text-xs font-semibold">Chargement de la galerie...</span>
          </div>
        } @else if (activeTab() === 'photos') {
          <!-- PHOTOS TAB -->
          <div class="space-y-4">
            <!-- Add Photo Input -->
            <div class="bg-gray-50 p-4 rounded-2xl border border-gray-200/80 space-y-3">
              <h4 class="text-xs font-bold uppercase tracking-wider text-gray-700">Ajouter une image à l'édition</h4>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div class="sm:col-span-2">
                  <input
                    type="url"
                    [(ngModel)]="newPhotoUrl"
                    placeholder="URL de l'image (https://... ou assets/...)"
                    class="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/40"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    [(ngModel)]="newPhotoCaption"
                    placeholder="Légende (Optionnel)"
                    class="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/40"
                  />
                </div>
              </div>

              <div class="flex justify-end">
                <button
                  type="button"
                  (click)="addPhoto()"
                  [disabled]="!newPhotoUrl"
                  class="inline-flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-700 disabled:bg-gray-300 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
                >
                  <span>+ Ajouter l'image</span>
                </button>
              </div>
            </div>

            <!-- Photos Grid -->
            @if (galleryImages().length === 0) {
              <div class="text-center py-10 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 text-gray-400 text-xs">
                Aucune image spécifique ajoutée. Les images par défaut ou albums seront affichés.
              </div>
            } @else {
              <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                @for (img of galleryImages(); track $index) {
                  <div class="relative group rounded-2xl overflow-hidden border border-gray-200 bg-gray-100 aspect-video shadow-xs">
                    <img
                      [src]="img.url"
                      [alt]="img.caption || 'Photo'"
                      class="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      (error)="handleImageError($event)"
                    />
                    <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition p-2 flex flex-col justify-between">
                      <button
                        type="button"
                        (click)="removePhoto($index)"
                        class="self-end p-1.5 bg-red-600 text-white rounded-lg text-xs hover:bg-red-700 transition cursor-pointer shadow-xs"
                        title="Supprimer cette image"
                      >
                        🗑️
                      </button>
                      @if (img.caption) {
                        <p class="text-[11px] text-white font-medium truncate">{{ img.caption }}</p>
                      }
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        } @else {
          <!-- ALBUMS TAB -->
          <div class="space-y-4">
            <!-- Add Album Form -->
            <div class="bg-gray-50 p-4 rounded-2xl border border-gray-200/80 space-y-3">
              <h4 class="text-xs font-bold uppercase tracking-wider text-gray-700">Ajouter un lien d'album photo public (Google Photos, Flickr, Drive)</h4>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-semibold text-gray-700 mb-1">Titre de l'Album *</label>
                  <input
                    type="text"
                    [(ngModel)]="newAlbumTitle"
                    placeholder="Ex: Album Officiel DevFest Kivu 2025"
                    class="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/40"
                  />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-700 mb-1">Lien de l'Album Public *</label>
                  <input
                    type="url"
                    [(ngModel)]="newAlbumUrl"
                    placeholder="https://photos.app.goo.gl/... ou https://flickr.com/..."
                    class="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/40"
                  />
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-semibold text-gray-700 mb-1">Image de couverture (URL)</label>
                  <input
                    type="url"
                    [(ngModel)]="newAlbumCover"
                    placeholder="https://..."
                    class="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/40"
                  />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-700 mb-1">Date / Période</label>
                  <input
                    type="text"
                    [(ngModel)]="newAlbumDate"
                    placeholder="Ex: Novembre 2025"
                    class="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/40"
                  />
                </div>
              </div>

              <div class="flex justify-end">
                <button
                  type="button"
                  (click)="addAlbum()"
                  [disabled]="!newAlbumTitle || !newAlbumUrl"
                  class="inline-flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-700 disabled:bg-gray-300 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
                >
                  <span>+ Ajouter l'album</span>
                </button>
              </div>
            </div>

            <!-- Albums List -->
            @if (albums().length === 0) {
              <div class="text-center py-10 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 text-gray-400 text-xs">
                Aucun album externe configuré pour cette édition.
              </div>
            } @else {
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                @for (alb of albums(); track $index) {
                  <div class="bg-gray-50/70 hover:bg-gray-50 rounded-2xl p-4 border border-gray-200 flex items-center justify-between gap-3">
                    <div class="min-w-0 space-y-1">
                      <h4 class="text-sm font-bold text-gray-900 truncate">{{ alb.title }}</h4>
                      <p class="text-xs text-gray-500 font-mono truncate">{{ alb.url }}</p>
                      @if (alb.date) {
                        <span class="text-[11px] text-pink-600 font-semibold">📅 {{ alb.date }}</span>
                      }
                    </div>

                    <div class="flex items-center gap-2 flex-shrink-0">
                      <a
                        [href]="alb.url"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="p-2 text-xs font-semibold text-pink-600 hover:bg-pink-50 rounded-lg transition"
                        title="Ouvrir le lien"
                      >
                        🔗
                      </a>
                      <button
                        type="button"
                        (click)="removeAlbum($index)"
                        class="p-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                        title="Supprimer l'album"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        }

        @if (feedbackMessage()) {
          <div
            class="text-xs p-3 rounded-xl border flex items-center gap-2"
            [class.bg-green-50]="feedbackType() === 'success'"
            [class.text-green-800]="feedbackType() === 'success'"
            [class.border-green-200]="feedbackType() === 'success'"
            [class.bg-red-50]="feedbackType() === 'error'"
            [class.text-red-800]="feedbackType() === 'error'"
            [class.border-red-200]="feedbackType() === 'error'"
          >
            <span>{{ feedbackMessage() }}</span>
          </div>
        }

        <!-- Footer Actions -->
        <div class="flex items-center justify-between pt-4 border-t border-gray-100">
          <button
            type="button"
            (click)="close.emit()"
            class="px-4 py-2.5 text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition cursor-pointer"
          >
            Fermer
          </button>

          <button
            type="button"
            (click)="saveGalleryData()"
            [disabled]="isSaving()"
            class="flex items-center gap-2 px-5 py-2.5 bg-pink-600 hover:bg-pink-700 disabled:bg-gray-300 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition cursor-pointer"
          >
            @if (isSaving()) {
              <svg class="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Enregistrement...</span>
            } @else {
              <span>Enregistrer dans Firestore</span>
            }
          </button>
        </div>
      </div>
    </div>
  `,
})
export class GalleryModalComponent implements OnInit {
  @Input({ required: true }) editionId!: string;
  @Output() close = new EventEmitter<void>();
  @Output() updated = new EventEmitter<void>();

  private fs = inject(FirestoreService);

  activeTab = signal<'photos' | 'albums'>('photos');
  galleryImages = signal<EventGalleryItem[]>([]);
  albums = signal<EventAlbum[]>([]);
  isLoading = signal(true);
  isSaving = signal(false);
  feedbackMessage = signal<string | null>(null);
  feedbackType = signal<'success' | 'error'>('success');

  newPhotoUrl = '';
  newPhotoCaption = '';
  newAlbumTitle = '';
  newAlbumUrl = '';
  newAlbumCover = '';
  newAlbumDate = '';

  ngOnInit(): void {
    this.loadGalleryData();
  }

  private loadGalleryData(): void {
    this.isLoading.set(true);
    this.fs.getEvent(this.editionId).subscribe({
      next: (event) => {
        if (event) {
          const rawGallery = event.gallery || [];
          const normalized: EventGalleryItem[] = rawGallery.map((item: any) =>
            typeof item === 'string' ? { url: item } : item
          );
          this.galleryImages.set(normalized);
          this.albums.set(event.albums || []);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  addPhoto(): void {
    if (!this.newPhotoUrl.trim()) return;
    const item: EventGalleryItem = {
      url: this.newPhotoUrl.trim(),
      caption: this.newPhotoCaption.trim(),
      order: this.galleryImages().length + 1,
    };
    this.galleryImages.update((list) => [...list, item]);
    this.newPhotoUrl = '';
    this.newPhotoCaption = '';
  }

  removePhoto(index: number): void {
    this.galleryImages.update((list) => list.filter((_, i) => i !== index));
  }

  addAlbum(): void {
    if (!this.newAlbumTitle.trim() || !this.newAlbumUrl.trim()) return;
    const album: EventAlbum = {
      title: this.newAlbumTitle.trim(),
      url: this.newAlbumUrl.trim(),
      coverImage: this.newAlbumCover.trim() || undefined,
      date: this.newAlbumDate.trim() || undefined,
    };
    this.albums.update((list) => [...list, album]);
    this.newAlbumTitle = '';
    this.newAlbumUrl = '';
    this.newAlbumCover = '';
    this.newAlbumDate = '';
  }

  removeAlbum(index: number): void {
    this.albums.update((list) => list.filter((_, i) => i !== index));
  }

  handleImageError(event: Event): void {
    (event.target as HTMLImageElement).src = 'assets/logo.png';
  }

  async saveGalleryData(): Promise<void> {
    if (this.isSaving()) return;
    this.isSaving.set(true);
    this.feedbackMessage.set(null);

    try {
      await this.fs.saveEvent(this.editionId, {
        gallery: this.galleryImages(),
        albums: this.albums(),
      });

      this.feedbackType.set('success');
      this.feedbackMessage.set('Galerie et albums sauvegardés avec succès dans Firestore !');
      this.updated.emit();

      setTimeout(() => {
        this.close.emit();
      }, 1200);
    } catch (err: any) {
      this.feedbackType.set('error');
      this.feedbackMessage.set(err?.message || 'Erreur lors de la sauvegarde.');
    } finally {
      this.isSaving.set(false);
    }
  }
}
