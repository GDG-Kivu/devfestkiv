import { Component, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirestoreService } from '../../../../../../../core/firestore/firestore.service';
import { EventAlbum, EventGalleryItem } from '../../../../../../event/models/event.model';

@Component({
  selector: 'app-gallery-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: "gallery-modal.component.html"
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
    if (!this.newPhotoUrl.trim()) {
      this.feedbackType.set('error');
      this.feedbackMessage.set('Veuillez renseigner le lien (URL) de l\'image.');
      return;
    }
    const item: EventGalleryItem = {
      url: this.newPhotoUrl.trim(),
      caption: this.newPhotoCaption.trim(),
      order: this.galleryImages().length + 1,
    };
    this.galleryImages.update((list) => [...list, item]);
    this.newPhotoUrl = '';
    this.newPhotoCaption = '';
    this.feedbackMessage.set(null);
  }

  removePhoto(index: number): void {
    this.galleryImages.update((list) => list.filter((_, i) => i !== index));
  }

  addAlbum(): void {
    if (!this.newAlbumTitle.trim()) {
      this.feedbackType.set('error');
      this.feedbackMessage.set('Veuillez renseigner le titre de l\'album.');
      return;
    }
    if (!this.newAlbumUrl.trim()) {
      this.feedbackType.set('error');
      this.feedbackMessage.set('Veuillez renseigner le lien de l\'album public.');
      return;
    }
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
    this.feedbackMessage.set(null);
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
      this.feedbackMessage.set('Galerie et albums sauvegardés avec succès !');
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
