import { Component, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirestoreService } from '../../../../../../../core/firestore/firestore.service';
import { EventPartner } from '../../../../../../event/models/partner.model';

@Component({
  selector: 'app-partners-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: "partners-modal.component.html" 
})
export class PartnersModalComponent implements OnInit {
  @Input({ required: true }) editionId!: string;
  @Output() close = new EventEmitter<void>();
  @Output() updated = new EventEmitter<void>();

  private fs = inject(FirestoreService);

  partners = signal<EventPartner[]>([]);
  isLoading = signal(true);
  showForm = signal(false);
  isEditing = signal(false);
  isSaving = signal(false);
  feedbackMessage = signal<string | null>(null);
  feedbackType = signal<'success' | 'error'>('success');

  activePartner: EventPartner = {
    id: '',
    name: '',
    role: 'Partenaire Principal',
    logo: '',
    link: '',
    quote: '',
    order: 1,
    isPublished: true,
  };

  ngOnInit(): void {
    this.loadPartners();
  }

  private loadPartners(): void {
    this.isLoading.set(true);
    this.fs.getEventCollection<EventPartner>(this.editionId, 'partners').subscribe({
      next: (list) => {
        this.partners.set(list || []);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  openCreateForm(): void {
    this.activePartner = {
      id: '',
      name: '',
      role: 'Partenaire Principal',
      logo: '',
      link: '',
      quote: '',
      order: this.partners().length + 1,
      isPublished: true,
    };
    this.isEditing.set(false);
    this.feedbackMessage.set(null);
    this.showForm.set(true);
  }

  openEditForm(partner: EventPartner): void {
    this.activePartner = { ...partner };
    this.isEditing.set(true);
    this.feedbackMessage.set(null);
    this.showForm.set(true);
  }

  handleImageError(event: Event): void {
    (event.target as HTMLImageElement).src = 'assets/logo.png';
  }

  async savePartner(): Promise<void> {
    if (this.isSaving()) return;

    if (!this.activePartner.name?.trim()) {
      this.feedbackType.set('error');
      this.feedbackMessage.set('Veuillez renseigner le nom de l\'organisation ou du partenaire.');
      return;
    }
    if (!this.activePartner.role?.trim()) {
      this.feedbackType.set('error');
      this.feedbackMessage.set('Veuillez renseigner le type ou rôle du partenariat (ex: Partenaire Or).');
      return;
    }

    this.isSaving.set(true);
    this.feedbackMessage.set(null);

    try {
      if (this.isEditing() && this.activePartner.id) {
        await this.fs.saveEventDocument(this.editionId, 'partners', this.activePartner);
      } else {
        const id = await this.fs.createEventDocument(this.editionId, 'partners', this.activePartner);
        this.activePartner.id = id;
      }

      this.feedbackType.set('success');
      this.feedbackMessage.set('Partenaire enregistré avec succès !');
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

  async deletePartner(partner: EventPartner): Promise<void> {
    if (!partner.id) return;
    if (!confirm(`Supprimer le partenaire "${partner.name}" ?`)) return;

    try {
      await this.fs.deleteEventDocument(this.editionId, 'partners', partner.id);
      this.updated.emit();
    } catch (err: any) {
      alert(err?.message || 'Erreur lors de la suppression.');
    }
  }
}
